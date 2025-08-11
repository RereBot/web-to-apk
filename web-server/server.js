import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { spawn, execSync } from 'child_process';
import axios from 'axios';
import * as cheerio from 'cheerio';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Java reserved keywords that cannot be used in package names
const JAVA_KEYWORDS = [
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
  'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
  'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native',
  'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp',
  'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void',
  'volatile', 'while', 'true', 'false', 'null'
];

// Helper function to check for Java keywords in package name
const containsJavaKeywords = (packageName) => {
  const parts = packageName.split('.');
  return parts.some(part => JAVA_KEYWORDS.includes(part.toLowerCase()));
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'"]
    }
  }
}));

app.use(cors());

// Rate limiting with JSON response - Very permissive for APK building
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes (1 hour)
  max: 500, // limit each IP to 500 requests per hour (much more generous)
  message: {
    status: 'error',
    error: getMessage('rateLimitError', 'en'),
    category: 'RATE_LIMIT',
    solution: getMessage('rateLimitSolution', 'en'),
    troubleshooting: getMessage('rateLimitTroubleshooting', 'en').split(', ')
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(429).json({
      status: 'error',
      error: getMessage('rateLimitError', 'en'),
      category: 'RATE_LIMIT',
      solution: getMessage('rateLimitSolution', 'en'),
      troubleshooting: getMessage('rateLimitTroubleshooting', 'en').split(', ')
    });
  }
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Custom download route to handle Chinese filenames properly
app.get('/downloads/:buildId/:filename', (req, res) => {
  const { buildId, filename } = req.params;
  const filePath = path.join(__dirname, 'downloads', buildId, filename);

  // Check if file exists
  if (!fsSync.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Set proper headers for Chinese filename support
  const encodedFilename = encodeURIComponent(filename);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');

  // Send file
  res.sendFile(filePath);
});

// Dedicated APK download route with Chinese filename support
app.get('/download-apk/:buildId', async (req, res) => {
  try {
    const { buildId } = req.params;
    const outputDir = path.join(__dirname, 'downloads', buildId);

    // Check if build directory exists
    if (!fsSync.existsSync(outputDir)) {
      return res.status(404).json({ error: 'Build not found' });
    }

    // Find APK file in the directory
    const files = await fs.readdir(outputDir);
    const apkFile = files.find(file => file.endsWith('.apk'));

    if (!apkFile) {
      return res.status(404).json({ error: 'APK file not found' });
    }

    const filePath = path.join(outputDir, apkFile);

    // Read build result to get original app name
    let originalAppName = apkFile.replace('.apk', '');
    try {
      const buildResultPath = path.join(outputDir, 'build-result.json');
      const buildResult = JSON.parse(await fs.readFile(buildResultPath, 'utf8'));
      if (buildResult.config && buildResult.config.appName) {
        originalAppName = buildResult.config.appName;
      }
    } catch (buildResultError) {
      console.log('Could not read build result for filename:', buildResultError.message);
    }

    // Create friendly filename with Chinese support
    const friendlyFilename = `${originalAppName}.apk`;
    const encodedFilename = encodeURIComponent(friendlyFilename);

    // Set proper headers for Chinese filename support
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Length', fsSync.statSync(filePath).size);

    // Send file
    res.sendFile(filePath);

  } catch (error) {
    console.error('Download APK error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Ensure directories exist
const ensureDirectories = async () => {
  const dirs = ['uploads', 'downloads', 'temp'];
  for (const dir of dirs) {
    const dirPath = path.join(__dirname, dir);
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'icon') {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid icon file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
      }
    } else if (file.fieldname === 'keystoreFile') {
      const allowedExtensions = ['.keystore', '.jks'];
      const fileName = file.originalname.toLowerCase();
      if (allowedExtensions.some(ext => fileName.endsWith(ext))) {
        cb(null, true);
      } else {
        cb(new Error('Invalid keystore file type. Only .keystore and .jks files are allowed.'));
      }
    } else {
      cb(new Error('Unexpected file field.'));
    }
  }
});

// Favicon fetcher
const fetchFavicon = async (url) => {
  try {
    // Normalize URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);

    // Try to find favicon links
    const faviconSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]'
    ];

    for (const selector of faviconSelectors) {
      const faviconLink = $(selector).attr('href');
      if (faviconLink) {
        let faviconUrl = faviconLink;
        if (faviconUrl.startsWith('//')) {
          faviconUrl = 'https:' + faviconUrl;
        } else if (faviconUrl.startsWith('/')) {
          const urlObj = new URL(url);
          faviconUrl = `${urlObj.protocol}//${urlObj.host}${faviconUrl}`;
        } else if (!faviconUrl.startsWith('http')) {
          const urlObj = new URL(url);
          faviconUrl = `${urlObj.protocol}//${urlObj.host}/${faviconUrl}`;
        }

        // Try to fetch the favicon
        const faviconResponse = await axios.get(faviconUrl, {
          responseType: 'arraybuffer',
          timeout: 5000
        });

        if (faviconResponse.status === 200) {
          return Buffer.from(faviconResponse.data);
        }
      }
    }

    // Fallback: try /favicon.ico
    const urlObj = new URL(url);
    const faviconUrl = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
    const faviconResponse = await axios.get(faviconUrl, {
      responseType: 'arraybuffer',
      timeout: 5000
    });

    if (faviconResponse.status === 200) {
      return Buffer.from(faviconResponse.data);
    }

    return null;
  } catch (error) {
    console.log('Failed to fetch favicon:', error.message);
    return null;
  }
};

// Import error handler
import { errorHandler } from './ErrorHandler.js';

// Import internationalization messages
import { getMessage } from './locales/messages.js';

// Standardized JSON response formatter
const sendJSONResponse = (res, statusCode, data) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(statusCode).json(data);
};

// Generate default icon
const generateDefaultIcon = async () => {
  const svg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="80" fill="url(#grad)"/>
      <path d="M256 120c-75.2 0-136 60.8-136 136s60.8 136 136 136 136-60.8 136-136-60.8-136-136-136zm0 240c-57.4 0-104-46.6-104-104s46.6-104 104-104 104 46.6 104 104-46.6 104-104 104z" fill="white"/>
      <circle cx="256" cy="256" r="40" fill="white"/>
    </svg>
  `;

  return await sharp(Buffer.from(svg))
    .png()
    .resize(512, 512)
    .toBuffer();
};

// Process icon (resize and optimize)
const processIcon = async (iconBuffer) => {
  return await sharp(iconBuffer)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toBuffer();
};

// ===== Smart splash screen color detection utility functions =====
/**
 * Determine if HEX color is light
 * @param {string} hexColor - HEX color string (e.g., #282F40)
 * @returns {boolean} - true for light color, false for dark color
 */
const isLightColor = (hexColor) => {
  try {
    // Remove # symbol and validate format
    const hex = hexColor.replace('#', '');
    if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
      console.log(`Invalid hex color format: ${hexColor}, using default light detection`);
      return true; // Default to light color on exception
    }

    // Parse RGB values
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // Calculate perceived brightness (ITU-R BT.709 standard)
    const luma = (0.299 * r + 0.587 * g + 0.114 * b);

    // Use threshold 128 to determine light/dark
    const isLight = luma > 128;

    console.log(`Color analysis: ${hexColor} -> RGB(${r},${g},${b}) -> Luma(${luma.toFixed(1)}) -> ${isLight ? 'Light' : 'Dark'}`);

    return isLight;
  } catch (error) {
    console.error(`Error analyzing color ${hexColor}:`, error);
    return true; // Default to light color on exception
  }
};

/**
 * Get adaptive loading animation color based on background color
 * @param {string} backgroundColor - Background color HEX string
 * @returns {string} - Adaptive loading animation color
 */
const getAdaptiveSpinnerColor = (backgroundColor) => {
  const isLight = isLightColor(backgroundColor);
  const spinnerColor = isLight ? '#000000' : '#FFFFFF';
  console.log(`Adaptive spinner: Background(${backgroundColor}) -> Spinner(${spinnerColor})`);
  return spinnerColor;
};

// Environment validation
const validateBuildEnvironment = async () => {
  const errors = [];

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 16) {
    errors.push(`Node.js version ${nodeVersion} is not supported. Please use Node.js 16 or higher.`);
  }

  // Check available memory
  const os = await import('os');
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;

  if (memoryUsagePercent > 90) {
    errors.push(`High memory usage detected (${memoryUsagePercent.toFixed(1)}%). This may cause build failures.`);
  }

  // Check disk space
  try {
    const fsSync = await import('fs');
    const stats = fsSync.statSync(__dirname);
    // This is a basic check - in production you might want to use a more sophisticated disk space check
  } catch (error) {
    errors.push('Unable to check disk space availability.');
  }

  return errors;
};

// ===== Unified styles.xml management function =====
/**
 * Unified styles.xml management function for all styles.xml read/write operations
 * @param {string} tempDir - Temporary build directory
 * @param {object} config - Build configuration
 * @param {object} options - Configuration options
 * @param {boolean} options.includeCompleteThemes - Whether to include complete Light/Dark themes
 * @param {boolean} options.includeBasicThemes - Whether to include basic themes
 * @param {string} options.themeName - Dynamic theme name (Light or Dark)
 * @returns {Promise<object>} Operation result
 */
const manageStylesXml = async (tempDir, config, options = {}) => {
  try {
    console.log('Starting unified styles.xml management...');

    const {
      includeCompleteThemes = true,
      includeBasicThemes = true,
      themeName = null
    } = options;

    // Android resource directory path
    const androidResDir = path.join(tempDir, 'android', 'app', 'src', 'main', 'res');
    const valuesDir = path.join(androidResDir, 'values');
    const stylesXmlPath = path.join(valuesDir, 'styles.xml');

    // Ensure directory exists
    await fs.mkdir(valuesDir, { recursive: true });

    // Step 2: Implement smart content merging logic
    console.log('Reading existing styles.xml content...');
    let existingContent = '';
    let existingStyles = new Set();

    // a. First read existing styles.xml content
    try {
      if (fsSync.existsSync(stylesXmlPath)) {
        existingContent = await fs.readFile(stylesXmlPath, 'utf8');
        console.log('Found existing styles.xml, analyzing content...');

        // b. Parse content and identify all existing <style name="..."> definitions
        const styleMatches = existingContent.match(/<style\s+name="([^"]+)"/g);
        if (styleMatches) {
          styleMatches.forEach(match => {
            const nameMatch = match.match(/name="([^"]+)"/);
            if (nameMatch) {
              existingStyles.add(nameMatch[1]);
            }
          });
          console.log('Found existing styles:', Array.from(existingStyles));
        } else {
          console.log('No existing style definitions found');
        }
      } else {
        console.log('No existing styles.xml found, will create new file');
      }
    } catch (readError) {
      console.log('Error reading existing styles.xml:', readError.message);
      existingContent = '';
      existingStyles.clear();
    }

    // Build required style definitions
    const requiredStyles = new Map();

    // Basic theme definitions
    if (includeBasicThemes) {
      if (!existingStyles.has('AppTheme')) {
        requiredStyles.set('AppTheme', `    <!-- Basic application theme -->
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/status_bar_color</item>
        <item name="colorPrimaryDark">@color/status_bar_color</item>
        <item name="android:statusBarColor">@color/status_bar_color</item>
    </style>`);
      }

      if (!existingStyles.has('AppTheme.NoActionBar')) {
        requiredStyles.set('AppTheme.NoActionBar', `    <!-- Basic NoActionBar theme -->
    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="colorPrimary">@color/status_bar_color</item>
        <item name="colorPrimaryDark">@color/status_bar_color</item>
        <item name="android:statusBarColor">@color/status_bar_color</item>
        <item name="android:windowFullscreen">false</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
    </style>`);
      }
    }

    // Complete Light/Dark theme definitions
    if (includeCompleteThemes) {
      // c. Compare new themes to add, only add definitions if they don't exist yet
      if (!existingStyles.has('AppTheme.NoActionBarLaunch.Light')) {
        requiredStyles.set('AppTheme.NoActionBarLaunch.Light', `    <!-- Light theme: suitable for light backgrounds -->
    <style name="AppTheme.NoActionBarLaunch.Light" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">@color/splash_background_light</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
        <item name="android:textColor">#000000</item>
        <item name="android:textColorPrimary">#000000</item>
        <item name="android:textColorSecondary">#000000</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <item name="android:windowAnimationStyle">@null</item>
        <item name="android:windowDisablePreview">true</item>
    </style>`);
      } else {
        console.log('AppTheme.NoActionBarLaunch.Light already exists, skipping');
      }

      if (!existingStyles.has('AppTheme.NoActionBarLaunch.Dark')) {
        requiredStyles.set('AppTheme.NoActionBarLaunch.Dark', `    <!-- Dark theme: suitable for dark backgrounds -->
    <style name="AppTheme.NoActionBarLaunch.Dark" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">@color/splash_background_dark</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
        <item name="android:textColor">#FFFFFF</item>
        <item name="android:textColorPrimary">#FFFFFF</item>
        <item name="android:textColorSecondary">#FFFFFF</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <item name="android:windowAnimationStyle">@null</item>
        <item name="android:windowDisablePreview">true</item>
    </style>`);
      } else {
        console.log('AppTheme.NoActionBarLaunch.Dark already exists, skipping');
      }
    }

    // Dynamic theme definition (if theme name is specified)
    if (themeName && !existingStyles.has(`AppTheme.NoActionBarLaunch.${themeName}`)) {
      const isLight = isLightColor(config.statusBarColor);
      const textColor = isLight ? '#000000' : '#FFFFFF';

      requiredStyles.set(`AppTheme.NoActionBarLaunch.${themeName}`, `    <!-- Dynamic splash screen theme (backward compatible) -->
    <style name="AppTheme.NoActionBarLaunch.${themeName}" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">@color/splash_background</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
        <item name="android:textColor">${textColor}</item>
        <item name="android:textColorPrimary">${textColor}</item>
        <item name="android:textColorSecondary">${textColor}</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <item name="android:windowAnimationStyle">@null</item>
        <item name="android:windowDisablePreview">true</item>
    </style>`);
    } else if (themeName) {
      console.log(`AppTheme.NoActionBarLaunch.${themeName} already exists, skipping`);
    }

    // Generate final XML content
    if (requiredStyles.size > 0) {
      console.log(`Adding ${requiredStyles.size} new style definitions...`);

      let finalXmlContent;

      if (existingContent && existingContent.includes('<resources>')) {
        // If existing content exists, insert new styles before </resources>
        const newStylesContent = Array.from(requiredStyles.values()).join('\n\n');
        finalXmlContent = existingContent.replace(
          '</resources>',
          `\n${newStylesContent}\n</resources>`
        );
      } else {
        // If no existing content, create complete new file
        const allStylesContent = Array.from(requiredStyles.values()).join('\n\n');
        finalXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
${allStylesContent}
</resources>`;
      }

      await fs.writeFile(stylesXmlPath, finalXmlContent);
      console.log(`Successfully updated styles.xml with ${requiredStyles.size} new styles`);
      console.log('Added styles:', Array.from(requiredStyles.keys()));

      return {
        success: true,
        stylesAdded: Array.from(requiredStyles.keys()),
        stylesSkipped: Array.from(existingStyles),
        filePath: stylesXmlPath
      };
    } else {
      console.log('All required styles already exist, no changes needed');
      return {
        success: true,
        stylesAdded: [],
        stylesSkipped: Array.from(existingStyles),
        filePath: stylesXmlPath
      };
    }

  } catch (error) {
    console.error('Error in manageStylesXml:', error);
    return {
      success: false,
      error: error.message,
      stylesAdded: [],
      stylesSkipped: []
    };
  }
};

// ===== Android native theme generation function =====
/**
 * Generate Android native theme files with light/dark adaptation support
 * @param {string} tempDir - Temporary build directory
 * @param {object} config - Build configuration
 */
const generateAndroidThemes = async (tempDir, config) => {
  try {
    console.log('Generating adaptive Android themes...');

    const isLight = isLightColor(config.statusBarColor);
    const textColor = isLight ? '#000000' : '#FFFFFF';
    const themeName = isLight ? 'Light' : 'Dark';

    console.log(`Theme selection: Background(${config.statusBarColor}) -> Theme(${themeName}) -> Text(${textColor})`);

    // Android resource directory path
    const androidResDir = path.join(tempDir, 'android', 'app', 'src', 'main', 'res');
    const valuesDir = path.join(androidResDir, 'values');

    // Ensure directory exists
    await fs.mkdir(valuesDir, { recursive: true });

    // Generate colors.xml with Light/Dark theme color resources
    const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Smart splash screen color configuration -->
    <color name="splash_background">${config.statusBarColor}</color>
    <color name="splash_text_color">${textColor}</color>
    <color name="status_bar_color">${config.statusBarColor}</color>
    
    <!-- Light/Dark theme color resources using user-provided statusBarColor -->
    <color name="splash_background_light">${config.statusBarColor}</color>
    <color name="splash_background_dark">${config.statusBarColor}</color>
</resources>`;

    await fs.writeFile(path.join(valuesDir, 'colors.xml'), colorsXml);
    console.log('Generated colors.xml with adaptive colors');

    // Step 3: Replace with unified styles.xml management function call
    console.log('Using unified styles.xml management...');
    const stylesResult = await manageStylesXml(tempDir, config, {
      includeCompleteThemes: true,
      includeBasicThemes: true,
      themeName: themeName
    });

    if (stylesResult.success) {
      if (stylesResult.stylesAdded.length > 0) {
        console.log(`Generated complete styles.xml with themes: ${stylesResult.stylesAdded.join(', ')}`);
      } else {
        console.log('All required styles already exist in styles.xml');
      }
    } else {
      console.error('Failed to manage styles.xml:', stylesResult.error);
      // Don't throw error, let build continue
    }

    // Modify AndroidManifest.xml to apply correct theme
    const manifestPath = path.join(tempDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

    // Wait for AndroidManifest.xml to be generated before modifying
    let manifestContent = '';
    let retryCount = 0;
    const maxRetries = 10;

    while (retryCount < maxRetries) {
      try {
        manifestContent = await fs.readFile(manifestPath, 'utf8');
        break;
      } catch (error) {
        console.log(`Waiting for AndroidManifest.xml to be generated... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        retryCount++;
      }
    }

    if (manifestContent) {
      // Precise AndroidManifest.xml theme replacement
      console.log('Original AndroidManifest.xml theme references:');
      const originalThemeMatches = manifestContent.match(/android:theme="[^"]*"/g);
      console.log(originalThemeMatches || 'No theme references found');

      // Use powerful regex to ensure all launch theme references are replaced with dynamic theme
      const updatedManifest = manifestContent.replace(
        /android:theme="@style\/AppTheme\.NoActionBarLaunch[^"]*"/g,
        `android:theme="@style/AppTheme.NoActionBarLaunch.${themeName}"`
      );

      console.log('Updated AndroidManifest.xml theme references:');
      const updatedThemeMatches = updatedManifest.match(/android:theme="[^"]*"/g);
      console.log(updatedThemeMatches || 'No theme references found');

      // Verify replacement success
      const hasCorrectTheme = updatedManifest.includes(`@style/AppTheme.NoActionBarLaunch.${themeName}`);
      console.log(`Theme replacement verification: ${hasCorrectTheme ? 'SUCCESS' : 'FAILED'}`);

      await fs.writeFile(manifestPath, updatedManifest);
      console.log(`Updated AndroidManifest.xml to use dynamic theme: AppTheme.NoActionBarLaunch.${themeName}`);
    } else {
      console.log('AndroidManifest.xml not found, theme will be applied during build');
    }

    console.log('Android adaptive themes generation completed!');

    return {
      themeName,
      textColor,
      backgroundColor: config.statusBarColor
    };

  } catch (error) {
    console.error('Error generating Android themes:', error);
    // Don't throw error, let build continue
    return null;
  }
};

// ===== BUILD ERROR TRANSLATION FUNCTION =====
const translateBuildError = (errorMessage) => {
  const errorLower = errorMessage.toLowerCase();
  
  // Java keyword errors
  if (errorLower.includes('is not a valid java package name') && errorLower.includes('keyword')) {
    return { messageKey: 'error.javaKeyword', category: 'VALIDATION_ERROR' };
  }
  
  // Memory errors
  if (errorLower.includes('out of memory') || errorLower.includes('java heap space')) {
    return { messageKey: 'error.outOfMemory', category: 'RESOURCE_ERROR' };
  }
  
  // Network/dependency errors
  if (errorLower.includes('could not resolve') || errorLower.includes('connection timed out')) {
    return { messageKey: 'error.networkDependency', category: 'NETWORK_ERROR' };
  }
  
  // Gradle daemon errors
  if (errorLower.includes('gradle daemon') || errorLower.includes('daemon process')) {
    return { messageKey: 'error.gradleDaemon', category: 'BUILD_ERROR' };
  }
  
  // SDK/tools errors
  if (errorLower.includes('sdk') && (errorLower.includes('not found') || errorLower.includes('missing'))) {
    return { messageKey: 'error.sdkMissing', category: 'ENVIRONMENT_ERROR' };
  }
  
  // Default fallback
  return { messageKey: 'error.buildGeneric', category: 'BUILD_ERROR' };
};

// ===== UNIFIED BUILD FUNCTION =====
const executeBuild = async (buildType, config, iconPath, keystorePath, outputDir) => {
  const tempDir = path.join(__dirname, 'temp', uuidv4());
  const cleanupTasks = [];

  // Cleanup function
  const cleanup = async () => {
    console.log('Cleaning up temporary files and directories...');
    for (const task of cleanupTasks) {
      try {
        await task();
      } catch (error) {
        console.log('Cleanup task failed:', error.message);
      }
    }
    console.log('Cleanup completed');
  };

  // Build progress stages configuration (Optimized for better UX)
  // Build progress stages configuration with optimized weight distribution
  const BUILD_STAGES = {
    INITIALIZING: { progress: 15, messageKey: 'buildStageInitializing' },
    PREPARING_FILES: { progress: 20, messageKey: 'buildStagePreparingFiles' },
    INSTALLING_DEPS: { progress: 30, messageKey: 'buildStageInstallingDeps' },
    ADDING_PLATFORM: { progress: 45, messageKey: 'buildStageAddingPlatform' },
    CONFIGURING_ANDROID: { progress: 55, messageKey: 'buildStageConfiguringAndroid' },
    BUILDING_APK_START: { progress: 65, messageKey: 'buildStageBuildingApkStart' },
    BUILDING_APK_PROGRESS: { progress: 80, messageKey: 'buildStageBuildingApkProgress' },
    BUILDING_APK_FINAL: { progress: 95, messageKey: 'buildStageBuildingApkFinal' },
    FINALIZING: { progress: 98, messageKey: 'buildStageFinalizing' },
    COMPLETED: { progress: 100, messageKey: 'buildStageCompleted' }
  };

  // Progress update function
  const updateBuildProgress = async (stage, additionalInfo = '') => {
    const stageInfo = BUILD_STAGES[stage];
    const progressData = {
      status: 'building',
      progress: stageInfo.progress,
      messageKey: stageInfo.messageKey,
      stage: stage,
      timestamp: new Date().toISOString(),
      buildType: buildType,
      additionalInfo: additionalInfo
    };

    try {
      await fs.writeFile(
        path.join(outputDir, 'build-result.json'),
        JSON.stringify(progressData, null, 2)
      );
      console.log(`Progress: ${stageInfo.progress}% - ${stageInfo.messageKey}`);
    } catch (error) {
      console.error('Failed to update build progress:', error);
    }
  };

  try {
    console.log(`Starting ${buildType.toUpperCase()} build`);
    console.log('Status bar color in executeBuild:', config.statusBarColor);

    // Stage 1: Initializing
    await updateBuildProgress('INITIALIZING');

    // Validate environment before starting
    const envErrors = await validateBuildEnvironment();
    if (envErrors.length > 0) {
      throw new Error(`Environment validation failed: ${envErrors.join('; ')}`);
    }

    await fs.mkdir(tempDir, { recursive: true });
    cleanupTasks.push(() => fs.rm(tempDir, { recursive: true, force: true }));

    // Add keystore cleanup task
    if (keystorePath) {
      cleanupTasks.push(() => fs.unlink(keystorePath).catch(() => { }));
    }

    await fs.mkdir(path.join(tempDir, 'dist'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'assets'), { recursive: true });

    // Stage 2: Preparing files
    await updateBuildProgress('PREPARING_FILES');

    // Create HTML file that embeds the website in iframe (prevents external browser launch)
    const htmlContent = config.websiteUrl ?
      `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${config.appName}</title>
                <style>
                  * {margin: 0; padding: 0; box-sizing: border-box; }
                  html, body {height: 100%; overflow: hidden; }
                  .app-container {
                    width: 100%;
                  height: 100vh;
                  position: relative;
                  background: #ffffff;
        }
                  .loading {
                    position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  color: #666;
                  z-index: 1;
        }
                  .website-frame {
                    width: 100%;
                  height: 100%;
                  border: none;
                  display: block;
                  background: #ffffff;
        }
                  .website-frame.loaded + .loading {
                    display: none;
        }
                </style>
                <script type="module">
        // Capacitor Back Button Handler
        document.addEventListener('DOMContentLoaded', async () => {
                    console.log('Initializing Capacitor back button handler...');

                  // Check if in Capacitor environment
                  if (window.Capacitor && window.Capacitor.Plugins) {
                const {App} = window.Capacitor.Plugins;

                  // Listen for physical back button events
                  App.addListener('backButton', ({canGoBack}) => {
                    console.log('Back button pressed, canGoBack:', canGoBack);
                  console.log('Current history length:', window.history.length);

                    // Due to iframe approach, main app history length is usually 1
                    // Exit app directly to achieve "one back press to exit" effect
                    if (window.history.length > 1) {
                    console.log('Navigating back in history');
                  window.history.back();
                    } else {
                    console.log('Exiting app - implementing single-back-to-exit behavior');
                  App.exitApp();
                    }
                });

                  console.log('Back button listener registered successfully');
            } else {
                    console.log('Not in Capacitor environment, back button handling skipped');
            }
        });
                </script>
              </head>
              <body>
                <div class="app-container">
                  <iframe
                    src="${config.websiteUrl}"
                    class="website-frame"
                    allowfullscreen
                    allow="camera; microphone; geolocation; payment"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
                    onload="this.classList.add('loaded')"
                  ></iframe>
                  <div class="loading">Loading ${config.appName}...</div>
                </div>
              </body>
            </html>` :
      `<!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${config.appName}</title>
                    <style>
                      body {
                        font - family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      margin: 0;
                      padding: 20px;
                      background: #f5f5f5;
                      color: #333;
                      min-height: 100vh;
                      display: flex;
                      align-items: center;
                      justify-content: center;
        }
                      .container {
                        text - align: center;
                      max-width: 500px;
                      padding: 40px;
                      background: white;
                      border-radius: 10px;
                      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <h1>${config.appName}</h1>
                      <p>Please provide a website URL to load content.</p>
                    </div>
                  </body>
                </html>`;

    await fs.writeFile(path.join(tempDir, 'dist', 'index.html'), htmlContent);

    // Copy icon if provided
    if (iconPath) {
      await fs.copyFile(iconPath, path.join(tempDir, 'assets', 'icon.png'));
      cleanupTasks.push(() => fs.unlink(iconPath).catch(() => { }));
    }

    // Create config file
    const webToApkConfig = {
      appName: config.appName,
      packageName: config.packageName,
      version: config.version,
      webDir: './dist',
      startUrl: 'index.html',
      permissions: ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'],
      ...(iconPath && { icon: './assets/icon.png' })
    };

    await fs.writeFile(
      path.join(tempDir, 'web-to-apk.config.json'),
      JSON.stringify(webToApkConfig, null, 2)
    );

    // Generate capacitor.config.json for Capacitor v6.0.0 compatibility
    const capacitorConfig = {
      appId: config.packageName,
      appName: config.appName,
      webDir: 'dist',
      server: {
        androidScheme: 'https'
      },
      plugins: {
        StatusBar: {
          style: 'DARK',
          backgroundColor: config.statusBarColor
        },
        NavigationBar: {
          backgroundColor: config.statusBarColor
        },
        SplashScreen: {
          launchShowDuration: 1500, // Optimized duration for better performance
          launchAutoHide: true, // Auto-hide enabled for compatibility
          backgroundColor: config.statusBarColor, // Sync with status bar color
          androidSplashResourceName: 'splash',
          showSpinner: true, // Display loading animation
          spinnerColor: getAdaptiveSpinnerColor(config.statusBarColor) // Adaptive color based on background
        }
      },
      android: {
        webContentsDebuggingEnabled: buildType === 'debug',
        allowMixedContent: true,
        overrideUserAgent: true,
        appendUserAgent: 'WebToAPK',
        backgroundColor: '#ffffff',
        // Capacitor v6.0.0 specific configurations to prevent external browser launch
        captureInput: true,
        webViewPresentationStyle: 'fullscreen',
        // Force all navigation to stay within the app WebView
        allowNavigation: [
          config.websiteUrl ? new URL(config.websiteUrl).hostname : '*'
        ]
      }
    };

    await fs.writeFile(
      path.join(tempDir, 'capacitor.config.json'),
      JSON.stringify(capacitorConfig, null, 2)
    );

    // Also create TypeScript version for better compatibility
    const capacitorConfigTs = `import {CapacitorConfig} from '@capacitor/cli';

                const config: CapacitorConfig = {
                  appId: '${config.packageName}',
                appName: '${config.appName}',
                webDir: 'dist',
                server: {
                  androidScheme: 'https'
  },
                plugins: {
                  StatusBar: {
                  style: 'DARK',
                backgroundColor: '${config.statusBarColor}'
    },
                NavigationBar: {
                  backgroundColor: '${config.statusBarColor}'
    },
                SplashScreen: {
                  launchShowDuration: 1500,
                launchAutoHide: true,
                backgroundColor: '${config.statusBarColor}',
                androidSplashResourceName: 'splash',
                showSpinner: true,
                spinnerColor: '${getAdaptiveSpinnerColor(config.statusBarColor)}'
    }
  },
                android: {
                  webContentsDebuggingEnabled: ${buildType === 'debug'},
                allowMixedContent: true,
                overrideUserAgent: true,
                appendUserAgent: 'WebToAPK',
                backgroundColor: '#ffffff',
                captureInput: true,
                webViewPresentationStyle: 'fullscreen',
                allowNavigation: [
                ${config.websiteUrl ? `'${new URL(config.websiteUrl).hostname}'` : `'*'`}
                ]
  }
};

                export default config;
                `;

    // Configuration validation
    console.log('Capacitor configuration generated');
    console.log('StatusBar backgroundColor in config:', config.statusBarColor);

    await fs.writeFile(
      path.join(tempDir, 'capacitor.config.ts'),
      capacitorConfigTs
    );

    console.log(`Generated capacitor.config.json and capacitor.config.ts for ${config.appName} (${config.packageName})`);
    console.log('StatusBar backgroundColor in config:', config.statusBarColor);
    console.log('Smart SplashScreen configured:');
    console.log(`   Duration: 1.5s (optimized for performance)`);
    console.log(`   Background: ${config.statusBarColor} (synced with StatusBar)`);
    console.log(`   Spinner: ${getAdaptiveSpinnerColor(config.statusBarColor)} (adaptive based on background)`);
    console.log(`   Theme: ${isLightColor(config.statusBarColor) ? 'Light' : 'Dark'} (auto-detected)`);

    // Environment detection logging
    console.log('Checking environment variables...');
    console.log({
      'ANDROID_HOME': process.env.ANDROID_HOME,
      'JAVA_HOME': process.env.JAVA_HOME
    });
    console.log('PATH variable:', process.env.PATH);

    // Manually build clean subprocess environment object
    const cleanEnv = {
      ...process.env,
      PATH: process.env.PATH,
      ANDROID_HOME: process.env.ANDROID_HOME,
      JAVA_HOME: process.env.JAVA_HOME
    };

    // Complete project initialization
    console.log('Initializing Capacitor project...');

    // Initialize package.json
    console.log('Step 2.1: Executing npm init -y');
    execSync('npm init -y', {
      cwd: tempDir,
      stdio: 'inherit',
      env: cleanEnv
    });
    console.log('Package.json initialization completed');

    // Stage 3: Installing dependencies
    await updateBuildProgress('INSTALLING_DEPS');

    // Install core Capacitor dependencies (v6.0.0 for SDK 35 compatibility)
    console.log('Step 2.2: Installing Capacitor core dependencies');
    execSync('npm install @capacitor/core@^6.0.0 @capacitor/cli@^6.0.0 @capacitor/android@^6.0.0 @capacitor/status-bar@^6.0.0 typescript', {
      cwd: tempDir,
      stdio: 'inherit',
      env: cleanEnv
    });
    console.log('Capacitor dependencies installation completed');

    // Create capacitor.config.ts (already exists, but ensure it's properly formatted)
    console.log('Step 2.3: Verifying capacitor.config.ts');
    const capacitorConfigContent = `import {CapacitorConfig} from '@capacitor/cli';

                const config: CapacitorConfig = {
                  appId: '${config.packageName}',
                appName: '${config.appName}',
                webDir: 'dist',
                server: {
                  androidScheme: 'https'
  },
                plugins: {
                  StatusBar: {
                  style: 'DARK',
                backgroundColor: '${config.statusBarColor}'
    },
                NavigationBar: {
                  backgroundColor: '${config.statusBarColor}'
    },
                SplashScreen: {
                  launchShowDuration: 1500,
                launchAutoHide: true,
                backgroundColor: '${config.statusBarColor}',
                androidSplashResourceName: 'splash',
                showSpinner: true,
                spinnerColor: '${getAdaptiveSpinnerColor(config.statusBarColor)}'
    }
  },
                android: {
                  webContentsDebuggingEnabled: false,
                allowMixedContent: true,
                overrideUserAgent: true,
                appendUserAgent: 'WebToAPK',
                backgroundColor: '#ffffff'
  }
};

                export default config;`;

    await fs.writeFile(path.join(tempDir, 'capacitor.config.ts'), capacitorConfigContent);
    console.log('capacitor.config.ts verified and updated');

    // Ensure webDir (dist) exists with content
    console.log('Step 2.4: Verifying webDir and content');
    const webDir = path.join(tempDir, 'dist');
    await fs.mkdir(webDir, { recursive: true });

    // Ensure index.html exists in webDir
    const indexHtmlPath = path.join(webDir, 'index.html');
    try {
      await fs.access(indexHtmlPath);
      console.log('index.html already exists in webDir');
    } catch {
      await fs.writeFile(indexHtmlPath, '<html><body><h1>Web-to-APK App</h1></body></html>');
      console.log('Created basic index.html in webDir');
    }

    console.log('Project initialization completed successfully!');

    // Generate absolute path to capacitor binary
    const capacitorBinaryPath = path.resolve(__dirname, '..', 'node_modules', '.bin', 'capacitor');

    // Stage 4: Adding Android platform
    await updateBuildProgress('ADDING_PLATFORM');

    // Execute Capacitor add android command
    console.log('--- Starting Capacitor add android command...');
    await new Promise((resolve, reject) => {
      const buildProcess = spawn(process.execPath, [capacitorBinaryPath, 'add', 'android'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: tempDir,
        env: cleanEnv
      });

      let stdout = '';
      let stderr = '';

      buildProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      buildProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('--- Android platform added successfully');
          resolve({ stdout, stderr });
        } else if (code === null) {
          reject(new Error('Add android process timed out'));
        } else {
          const rawError = stderr || stdout || `Add android process exited with code ${code}`;
          const cleanError = errorHandler.formatErrorForJSON(rawError);
          reject(new Error(`Add android failed: ${cleanError}`));
        }
      });

      buildProcess.on('error', (error) => {
        const cleanError = errorHandler.formatErrorForJSON(error.message);
        reject(new Error(`Failed to start add android process: ${cleanError}`));
      });
    });

    // Execute cap sync to synchronize plugin configurations
    console.log('--- Starting Capacitor sync to apply plugin configurations...');
    await new Promise((resolve, reject) => {
      const syncProcess = spawn(process.execPath, [capacitorBinaryPath, 'sync'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: tempDir,
        env: cleanEnv
      });

      let stdout = '';
      let stderr = '';

      syncProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      syncProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      syncProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Capacitor sync completed - StatusBar plugin configurations applied');
          resolve({ stdout, stderr });
        } else if (code === null) {
          reject(new Error('Capacitor sync process timed out'));
        } else {
          const rawError = stderr || stdout || `Capacitor sync process exited with code ${code}`;
          const cleanError = errorHandler.formatErrorForJSON(rawError);
          reject(new Error(`Capacitor sync failed: ${cleanError}`));
        }
      });

      syncProcess.on('error', (error) => {
        const cleanError = errorHandler.formatErrorForJSON(error.message);
        reject(new Error(`Failed to start Capacitor sync process: ${cleanError}`));
      });
    });

    // Stage 5: Configuring Android project and generating icons
    await updateBuildProgress('CONFIGURING_ANDROID');

    // Generate adaptive Android themes
    console.log('Step 3.3: Generating adaptive Android themes...');
    const themeResult = await generateAndroidThemes(tempDir, config);
    if (themeResult) {
      console.log(`Adaptive theme generated: ${themeResult.themeName} theme with ${themeResult.textColor} text on ${themeResult.backgroundColor} background`);
    }

    // Generate custom icon using official Capacitor tools
    if (iconPath) {
      console.log('Step 3.4: Installing @capacitor/assets for official icon generation...');
      try {
        // Install @capacitor/assets official tool
        execSync('npm install @capacitor/assets --save-dev', {
          cwd: tempDir,
          stdio: 'inherit',
          env: cleanEnv
        });
        console.log('@capacitor/assets installed successfully');

        // Prepare standard icon file structure
        console.log('Step 3.5: Preparing standard icon resources...');
        await fs.mkdir(path.join(tempDir, 'resources'), { recursive: true });

        // Copy user icon to standard Capacitor location (resources/icon.png)
        await fs.copyFile(iconPath, path.join(tempDir, 'resources', 'icon.png'));

        // Optional: Create icon-foreground.png for adaptive icons
        await fs.copyFile(iconPath, path.join(tempDir, 'resources', 'icon-foreground.png'));
        console.log('Icon resources prepared in standard structure');

        // Execute official Capacitor icon generation
        console.log('Step 3.6: Generating native icons using @capacitor/assets...');
        execSync('npx @capacitor/assets generate --iconBackgroundColor "#ffffff" --iconBackgroundColorDark "#000000"', {
          cwd: tempDir,
          stdio: 'inherit',
          env: cleanEnv
        });
        console.log('Native icons generated successfully using official Capacitor tools');

      } catch (officialIconError) {
        console.log('--- Official icon generation failed:', officialIconError.message);
        console.log('--- Falling back to manual icon copy method...');

        // Fallback: Manual icon copy method (existing logic)
        try {
          console.log('Step 3.4 (Fallback): Copying custom icon to Android resources manually...');
          const androidResDir = path.join(tempDir, 'android', 'app', 'src', 'main', 'res');
          const iconDirs = [
            'mipmap-hdpi',
            'mipmap-mdpi',
            'mipmap-xhdpi',
            'mipmap-xxhdpi',
            'mipmap-xxxhdpi'
          ];

          // Create icon directories and copy icons
          for (const iconDir of iconDirs) {
            const targetDir = path.join(androidResDir, iconDir);
            await fs.mkdir(targetDir, { recursive: true });
            await fs.copyFile(iconPath, path.join(targetDir, 'ic_launcher.png'));
            await fs.copyFile(iconPath, path.join(targetDir, 'ic_launcher_round.png'));
          }
          console.log('Custom icon copied to Android resources (fallback method)');
        } catch (fallbackIconError) {
          console.log('--- Fallback icon copy also failed:', fallbackIconError.message);
          console.log('--- Build will continue with default Capacitor icon...');
        }
      }
    }

    // Configure Android theme to hide address bar
    console.log('Step 3.5: Configuring Android theme to hide address bar...');
    try {
      const androidResDir = path.join(tempDir, 'android', 'app', 'src', 'main', 'res');
      const valuesDir = path.join(androidResDir, 'values');
      await fs.mkdir(valuesDir, { recursive: true });

      const stylesXmlPath = path.join(valuesDir, 'styles.xml');

      // Step 3: Replace with unified styles.xml management function call
      console.log('Using unified styles.xml management for release build...');

      // First call generateAndroidThemes to generate color resources
      const themeResult = await generateAndroidThemes(tempDir, config);

      // Then use unified styles.xml management function
      const stylesResult = await manageStylesXml(tempDir, config, {
        includeCompleteThemes: true,
        includeBasicThemes: true,
        themeName: themeResult ? themeResult.themeName : null
      });

      if (stylesResult.success) {
        if (stylesResult.stylesAdded.length > 0) {
          console.log(`Complete Android themes configured with styles: ${stylesResult.stylesAdded.join(', ')}`);
        } else {
          console.log('All required styles already exist in styles.xml');
        }
      } else {
        // If unified management function fails, use basic themes as fallback
        console.log('Unified styles.xml management failed, applying fallback...');

        const fallbackResult = await manageStylesXml(tempDir, config, {
          includeCompleteThemes: false,
          includeBasicThemes: true,
          themeName: null
        });

        if (fallbackResult.success) {
          console.log('Fallback basic themes applied successfully');
        } else {
          console.error('Both unified management and fallback failed:', fallbackResult.error);
        }
      }

      const manifestPath = path.join(tempDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
      let manifestContent = await fs.readFile(manifestPath, 'utf8');

      // Critical fix: precise replacement instead of risky regex
      manifestContent = manifestContent.replace(
        'android:theme="@style/AppTheme"',
        'android:theme="@style/AppTheme.NoActionBar"'
      );

      await fs.writeFile(manifestPath, manifestContent, 'utf8');
      console.log('AndroidManifest.xml updated with fullscreen theme');
      console.log(`Modified AndroidManifest.xml (${buildType} Build):`, manifestContent);
    } catch (themeError) {
      console.error('--- Failed to configure Android theme:', themeError.message);
      console.log('--- Build will continue without theme customization...');
    }

    // Create local.properties file
    console.log('Step 3.6: Creating local.properties file for Gradle...');
    try {
      const localPropertiesPath = path.join(tempDir, 'android', 'local.properties');
      const androidHome = process.env.ANDROID_HOME;
      if (!androidHome) {
        throw new Error('ANDROID_HOME environment variable is not set');
      }
      const normalizedSdkPath = androidHome.replace(/\\/g, '/');
      const localPropertiesContent = `sdk.dir=${normalizedSdkPath}\n`;
      await fs.writeFile(localPropertiesPath, localPropertiesContent);
      console.log(`local.properties created successfully at: ${localPropertiesPath}`);
      console.log(`SDK path set to: ${normalizedSdkPath}`);
    } catch (localPropsError) {
      console.error('--- Failed to create local.properties:', localPropsError.message);
      throw new Error(`Failed to create local.properties file: ${localPropsError.message}`);
    }

    // Create gradle.properties file for SDK 35 compatibility
    console.log('Step 3.7: Creating gradle.properties for SDK 35 compatibility...');
    try {
      const androidDir = path.join(tempDir, 'android');
      const gradlePropertiesPath = path.join(androidDir, 'gradle.properties');

      // Ensure android directory exists
      try {
        await fs.access(androidDir);
        console.log('Android directory exists');
      } catch {
        console.log('--- Android directory not found, creating it...');
        await fs.mkdir(androidDir, { recursive: true });
        console.log('Android directory created successfully');
      }

      const gradlePropertiesContent = `# Android SDK 35 compatibility settings
                android.suppressUnsupportedCompileSdk=35
                android.useAndroidX=true
                android.enableJetifier=true
                org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
                org.gradle.parallel=true
                org.gradle.daemon=false
                android.enableR8.fullMode=false
                # Additional aapt2 bug fixes
                android.aapt2.ignoreAssetsPattern=!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~
                android.enableBuildCache=false
                `;

      // Check if gradle.properties already exists
      try {
        await fs.access(gradlePropertiesPath);
        console.log('--- gradle.properties already exists, backing up and replacing...');
        const backupPath = `${gradlePropertiesPath}.backup.${Date.now()}`;
        await fs.copyFile(gradlePropertiesPath, backupPath);
        console.log(`Backup created at: ${backupPath}`);
      } catch {
        console.log('--- gradle.properties does not exist, creating new file...');
      }

      await fs.writeFile(gradlePropertiesPath, gradlePropertiesContent);
      console.log(`gradle.properties created successfully at: ${gradlePropertiesPath}`);
    } catch (gradlePropsError) {
      console.error('--- Failed to create gradle.properties:', gradlePropsError.message);
      console.log('--- Build will continue without gradle.properties optimizations...');
      console.log('--- Note: Some build optimizations may not be available');
    }

    // Handle release-specific keystore configuration
    if (buildType === 'release') {
      console.log('Step 3.8: Configuring release signing...');
      const androidKeystorePath = path.join(tempDir, 'android', 'release.keystore');
      try {
        await fs.copyFile(keystorePath, androidKeystorePath);
        console.log('Keystore copied to Android directory');
      } catch (keystoreCopyError) {
        console.error('--- Failed to copy keystore:', keystoreCopyError.message);
        throw new Error(`Failed to copy keystore: ${keystoreCopyError.message}`);
      }
    }

    // Add global Java 17 configuration to root build.gradle
    const stepNumber = buildType === 'release' ? '3.9' : '3.8';
    console.log(`Step ${stepNumber}: Appending global Java 17 configuration${buildType === 'release' ? ' and signing' : ''} to root build.gradle...`);
    try {
      const rootGradlePath = path.join(tempDir, 'android', 'build.gradle');

      let gradlePatch = `
                subprojects {
                  afterEvaluate {project ->
        if (project.hasProperty('android')) {
                  project.android {
                  // SDK version settings compatible with old and new syntax
                  compileSdkVersion 35

                defaultConfig {
                  targetSdkVersion 34
                }

                compileOptions {
                  sourceCompatibility = JavaVersion.VERSION_17
                    targetCompatibility = JavaVersion.VERSION_17
                }`;

      // Add signing configuration only for release builds
      if (buildType === 'release') {
        gradlePatch += `
                
                signingConfigs {
                    release {
                        storeFile file('release.keystore')
                        storePassword '${config.keystorePassword}'
                        keyAlias '${config.keyAlias}'
                        keyPassword '${config.keyPassword || config.keystorePassword}'
                    }
                }
                
                buildTypes {
                    release {
                        signingConfig signingConfigs.release
                        minifyEnabled false
                        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
                    }
                }`;
      }

      gradlePatch += `
            }
        }
    }
}
                `;

      // Execute append operation
      fsSync.appendFileSync(rootGradlePath, gradlePatch);

      console.log(`Global Java 17 configuration${buildType === 'release' ? ' and signing' : ''} appended successfully to: ${rootGradlePath}`);
      console.log(`All subprojects will now use Java 17 compatibility${buildType === 'release' ? ' and release signing' : ''}`);
    } catch (rootBuildGradleError) {
      console.error('--- Failed to append to root build.gradle:', rootBuildGradleError.message);
      throw new Error(`Failed to append global Java 17 configuration: ${rootBuildGradleError.message}`);
    }

    // Ultimate fix V2: Directly modify Android native theme files
    console.log('--- Applying direct Android theme modification for StatusBar color...');
    try {
      const stylesXmlPath = path.join(tempDir, 'android', 'app', 'src', 'main', 'res', 'values', 'styles.xml');

      if (fsSync.existsSync(stylesXmlPath)) {
        console.log(`Found styles.xml at: ${stylesXmlPath}`);

        // Read existing styles.xml content
        let stylesContent = fsSync.readFileSync(stylesXmlPath, 'utf8');
        console.log('Read existing styles.xml content');

        // Find AppTheme.NoActionBar theme definition
        const themeRegex = /(<style\s+name="AppTheme\.NoActionBar"[^>]*>)([\s\S]*?)(<\/style>)/;
        const themeMatch = stylesContent.match(themeRegex);

        if (themeMatch) {
          console.log('Found AppTheme.NoActionBar theme definition');

          // Check if statusBarColor configuration already exists
          const existingStatusBarColor = themeMatch[2].includes('android:statusBarColor');

          if (existingStatusBarColor) {
            // Replace existing statusBarColor
            const updatedThemeContent = themeMatch[2].replace(
              /<item\s+name="android:statusBarColor"[^>]*>.*?<\/item>/,
              `<item name="android:statusBarColor">${config.statusBarColor}</item>`
            );
            stylesContent = stylesContent.replace(themeMatch[2], updatedThemeContent);
            console.log(`Updated existing statusBarColor to: ${config.statusBarColor}`);
          } else {
            // Add new statusBarColor configuration
            const newStatusBarItem = `        <item name="android:statusBarColor">${config.statusBarColor}</item>\n`;
            const updatedThemeContent = themeMatch[2] + newStatusBarItem;
            stylesContent = stylesContent.replace(themeMatch[2], updatedThemeContent);
            console.log(`Added new statusBarColor: ${config.statusBarColor}`);
          }

          // Write back modified content
          fsSync.writeFileSync(stylesXmlPath, stylesContent, 'utf8');
          console.log('Successfully modified styles.xml with statusBarColor');

        } else {
          console.log('AppTheme.NoActionBar theme not found in styles.xml');
        }
      } else {
        console.log('styles.xml file not found, skipping theme modification');
      }
    } catch (themeModError) {
      console.log('Failed to modify Android theme:', themeModError.message);
      // Don't throw error, continue build process
    }

    // Ultimate fix: Check if complete theme definitions exist, avoid duplicate processing
    console.log('--- Checking for complete theme definitions...');
    try {
      const stylesXmlPath = path.join(tempDir, 'android', 'app', 'src', 'main', 'res', 'values', 'styles.xml');
      const colorsXmlPath = path.join(tempDir, 'android', 'app', 'src', 'main', 'res', 'values', 'colors.xml');

      // Check if complete theme definitions already exist
      let hasCompleteThemes = false;
      if (fsSync.existsSync(stylesXmlPath)) {
        const stylesContent = fsSync.readFileSync(stylesXmlPath, 'utf8');
        hasCompleteThemes = stylesContent.includes('AppTheme.NoActionBarLaunch.Light') &&
          stylesContent.includes('AppTheme.NoActionBarLaunch.Dark');
      }

      if (hasCompleteThemes) {
        console.log('Complete Light/Dark theme definitions already exist, skipping legacy color processing');
      } else {
        console.log('Complete theme definitions not found, applying legacy color processing...');

        // Create basic colors.xml file (only when no complete theme exists)
        const colorsXmlContent = `<?xml version="1.0" encoding="utf-8"?>
                <resources>
                  <color name="statusBarColor">${config.statusBarColor}</color>
                  <color name="colorPrimary">${config.statusBarColor}</color>
                  <color name="colorPrimaryDark">${config.statusBarColor}</color>
                </resources>`;

        fsSync.writeFileSync(colorsXmlPath, colorsXmlContent, 'utf8');
        console.log(`Created basic colors.xml with statusBarColor: ${config.statusBarColor}`);

        // Modify styles.xml to use color resource reference (only when no complete theme exists)
        if (fsSync.existsSync(stylesXmlPath)) {
          let stylesContent = fsSync.readFileSync(stylesXmlPath, 'utf8');

          // Find and replace hardcoded color values with resource references
          const themeRegex = /(<style\s+name="AppTheme\.NoActionBar"[^>]*>)([\s\S]*?)(<\/style>)/;
          const themeMatch = stylesContent.match(themeRegex);

          if (themeMatch) {
            // Replace or add statusBarColor reference
            let updatedThemeContent = themeMatch[2];

            if (updatedThemeContent.includes('android:statusBarColor')) {
              // Replace existing statusBarColor with resource reference
              updatedThemeContent = updatedThemeContent.replace(
                /<item\s+name="android:statusBarColor"[^>]*>.*?<\/item>/,
                '<item name="android:statusBarColor">@color/statusBarColor</item>'
              );
            } else {
              // Add new statusBarColor resource reference
              updatedThemeContent += '        <item name="android:statusBarColor">@color/statusBarColor</item>\n';
            }

            stylesContent = stylesContent.replace(themeMatch[2], updatedThemeContent);
            fsSync.writeFileSync(stylesXmlPath, stylesContent, 'utf8');
            console.log('Updated styles.xml to use color resource reference');
          }
        }
      }
    } catch (colorsError) {
      console.log('Failed to process colors.xml or update styles.xml:', colorsError.message);
    }

    // Ultimate fix: Task 2 - Modify MainActivity.java to set status bar color
    console.log('--- Modifying MainActivity.java for programmatic statusBar color setting...');
    try {
      // Build MainActivity.java path based on package name
      const packagePath = config.packageName.replace(/\./g, '/');
      const mainActivityPath = path.join(tempDir, 'android', 'app', 'src', 'main', 'java', packagePath, 'MainActivity.java');

      if (fsSync.existsSync(mainActivityPath)) {
        console.log(`Found MainActivity.java at: ${mainActivityPath}`);

        let mainActivityContent = fsSync.readFileSync(mainActivityPath, 'utf8');

        // Find the super.onCreate(savedInstanceState); line
        const onCreateRegex = /(super\.onCreate\(savedInstanceState\);)/;
        const onCreateMatch = mainActivityContent.match(onCreateRegex);

        if (onCreateMatch) {
          console.log('Found super.onCreate() call in MainActivity.java');

          // Check if status bar color setting code already exists
          const hasStatusBarCode = mainActivityContent.includes('setStatusBarColor');

          if (!hasStatusBarCode) {
            // Add status bar color setting code after super.onCreate()
            const statusBarCode = `

        // Set status bar color programmatically
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                  getWindow().setStatusBarColor(android.graphics.Color.parseColor("${config.statusBarColor}"));
        }`;

            const updatedContent = mainActivityContent.replace(
              onCreateMatch[1],
              onCreateMatch[1] + statusBarCode
            );

            fsSync.writeFileSync(mainActivityPath, updatedContent, 'utf8');
            console.log(`Added programmatic statusBar color setting to MainActivity.java: ${config.statusBarColor}`);
          } else {
            console.log('StatusBar color code already exists in MainActivity.java');
          }
        } else {
          console.log('super.onCreate() not found in MainActivity.java');
        }
      } else {
        console.log(`MainActivity.java not found at: ${mainActivityPath}`);
      }
    } catch (mainActivityError) {
      console.log('Failed to modify MainActivity.java:', mainActivityError.message);
    }

    // Stage 6: Starting APK build (longest stage)
    await updateBuildProgress('BUILDING_APK_START');

    // Execute Gradle build with appropriate command
    const gradleCommand = buildType === 'release' ? 'assembleRelease' : 'assembleDebug';
    console.log(`Step 4: Executing Gradle ${gradleCommand} command...`);
    const gradlewPath = path.join(tempDir, 'android', 'gradlew');
    console.log(`Gradle wrapper located at: ${gradlewPath}`);

    // Set permissions
    try {
      fsSync.chmodSync(gradlewPath, '755');
      console.log('Gradle wrapper permissions set to 755');
    } catch (chmodError) {
      console.log('--- chmod failed (likely Windows):', chmodError.message);
    }

    await new Promise((resolve, reject) => {
      console.log(`Executing Gradle build: ${gradleCommand}`);
      const buildProcess = spawn(gradlewPath, [gradleCommand], {
        cwd: path.join(tempDir, 'android'),
        env: cleanEnv,
        shell: true
      });

      let errorOutput = '';
      let buildStarted = false;
      let progressUpdated = false;

      buildProcess.stdout.on('data', async (data) => {
        const output = data.toString().trim();
        console.log(`Build output: ${output}`);

        // Update progress based on Gradle output
        if (!buildStarted && output.includes('> Task')) {
          buildStarted = true;
          await updateBuildProgress('BUILDING_APK_PROGRESS');
        }

        // Update to final build stage when nearing completion
        if (!progressUpdated && (output.includes('BUILD SUCCESSFUL') || output.includes('> Task :app:assemble'))) {
          progressUpdated = true;
          await updateBuildProgress('BUILDING_APK_FINAL');
        }
      });

      buildProcess.stderr.on('data', (data) => {
        const stderrStr = data.toString().trim();
        console.error(`[STDERR]: ${stderrStr}`);
        errorOutput += stderrStr + '\n';
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`Gradle ${gradleCommand} completed successfully`);
          resolve();
        } else {
          const rawError = `Gradle ${gradleCommand} process failed with exit code ${code}.\n\n--- Collected STDERR ---\n${errorOutput}`;
          const translatedError = translateBuildError(rawError);
          
          // Create enhanced error object
          const enhancedError = new Error(rawError);
          enhancedError.messageKey = translatedError.messageKey;
          enhancedError.category = translatedError.category;
          enhancedError.exitCode = code;
          
          reject(enhancedError);
        }
      });

      buildProcess.on('error', (err) => reject(err));
    });

    // Stage 7: Finalizing
    await updateBuildProgress('FINALIZING');

    // Find and copy the generated APK
    console.log('Step 5: Locating and copying generated APK...');
    const apkSearchDirs = [
      path.join(tempDir, 'android', 'app', 'build', 'outputs', 'apk', buildType),
      path.join(tempDir, 'android', 'app', 'build', 'outputs', 'apk')
    ];

    let apkFound = false;
    for (const searchDir of apkSearchDirs) {
      try {
        const files = await fs.readdir(searchDir);
        const apkFiles = files.filter(file => file.endsWith('.apk'));

        if (apkFiles.length > 0) {
          const apkFile = apkFiles[0];
          const sourcePath = path.join(searchDir, apkFile);
          const targetPath = path.join(outputDir, `${config.appName}.apk`);

          await fs.copyFile(sourcePath, targetPath);
          console.log(`APK copied successfully: ${targetPath}`);
          apkFound = true;
          break;
        }
      } catch (error) {
        console.log(`--- Search directory not found: ${searchDir}`);
      }
    }

    if (!apkFound) {
      throw new Error('Generated APK file not found in expected locations');
    }

    // Save build result
    const buildResult = {
      status: 'success',
      config: config,
      buildTime: new Date().toISOString(),
      buildType: buildType,
      apkPath: path.join(outputDir, `${config.appName}.apk`),
      downloadUrl: `/download-apk/${path.basename(outputDir)}`
    };

    await fs.writeFile(
      path.join(outputDir, 'build-result.json'),
      JSON.stringify(buildResult, null, 2)
    );
    // Stage 8: Completed
    await updateBuildProgress('COMPLETED');

    console.log(`Build result saved successfully for ${buildType} build`);

    console.log(`${buildType.toUpperCase()} build completed successfully`);

    // Build successful, execute cleanup
    await cleanup();
    return buildResult;

  } catch (error) {
    console.error(`${buildType} build failed:`, error);

    // Save error result
    const errorResult = {
      status: 'error',
      error: errorHandler.formatErrorForJSON(error.message),
      config: config,
      buildTime: new Date().toISOString(),
      buildType: buildType
    };

    try {
      await fs.writeFile(
        path.join(outputDir, 'build-result.json'),
        JSON.stringify(errorResult, null, 2)
      );
    } catch (writeError) {
      console.error('Failed to write error result:', writeError);
    }

    // Build failed, execute cleanup
    await cleanup();
    throw error;
  }
};

// ===== RELEASE BUILD FUNCTION (Wrapper) =====
const executeReleaseBuild = (config, iconPath, keystorePath, outputDir) =>
  executeBuild('release', config, iconPath, keystorePath, outputDir);

// ===== DEBUG BUILD FUNCTION (Wrapper) =====
const executeDebugBuild = (config, iconPath, outputDir) =>
  executeBuild('debug', config, iconPath, null, outputDir);

// ===== API ROUTES =====

// Debug build endpoint
app.post('/api/build', upload.fields([
  { name: 'icon', maxCount: 1 },
  { name: 'keystoreFile', maxCount: 1 }
]), async (req, res) => {
  const buildId = uuidv4();
  const outputDir = path.join(__dirname, 'downloads', buildId);

  try {
    await fs.mkdir(outputDir, { recursive: true });

    // Get language from request
    const lang = req.body.lang || 'en';

    const config = {
      appName: req.body.appName || 'My App',
      packageName: req.body.packageName || 'com.example.myapp',
      version: req.body.version || '1.0.0',
      websiteUrl: req.body.websiteUrl || '',
      statusBarColor: req.body.statusBarColor || '#4C2E85',
      lang: lang
    };

    // Log color value reception
    console.log('Status bar color received:', req.body.statusBarColor, '-> Final:', config.statusBarColor);

    // Validate required fields
    if (!config.appName.trim()) {
      return sendJSONResponse(res, 400, {
        status: 'error',
        error: getMessage('invalidAppName', lang),
        category: 'VALIDATION_ERROR',
        solution: getMessage('appNameSolution', lang),
        troubleshooting: getMessage('appNameTroubleshooting', lang).split(', ')
      });
    }

    if (!config.packageName.trim() || !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(config.packageName)) {
      return sendJSONResponse(res, 400, {
        status: 'error',
        error: 'Invalid package name format',
        category: 'VALIDATION_ERROR',
        solution: getMessage('packageNameSolution', lang),
        troubleshooting: getMessage('packageNameTroubleshooting', lang).split(', ')
      });
    }

    if (containsJavaKeywords(config.packageName)) {
      return sendJSONResponse(res, 400, {
        status: 'error',
        error: 'Package name contains Java keywords (like "final", "class", etc.). Please use different names.',
        category: 'VALIDATION_ERROR',
        solution: 'Change package name parts that are Java keywords to different names',
        troubleshooting: ['Avoid Java keywords like: final, class, interface, public, private, etc.', 'Use descriptive names like: com.mycompany.myapp']
      });
    }

    // Process icon
    let iconPath = null;
    if (req.files && req.files.icon && req.files.icon[0]) {
      try {
        const iconBuffer = await processIcon(await fs.readFile(req.files.icon[0].path));
        iconPath = path.join(__dirname, 'temp', `${buildId}-icon.png`);
        await fs.writeFile(iconPath, iconBuffer);

        // Clean up uploaded file
        await fs.unlink(req.files.icon[0].path);
      } catch (iconError) {
        console.error('Icon processing failed:', iconError);
        return sendJSONResponse(res, 400, {
          status: 'error',
          error: 'Failed to process icon',
          category: 'ICON_PROCESSING_ERROR',
          solution: getMessage('iconProcessingSolution', lang),
          troubleshooting: getMessage('iconProcessingTroubleshooting', lang).split(', ')
        });
      }
    } else {
      // Generate default icon
      try {
        const defaultIconBuffer = await generateDefaultIcon();
        iconPath = path.join(__dirname, 'temp', `${buildId}-icon.png`);
        await fs.writeFile(iconPath, defaultIconBuffer);
      } catch (defaultIconError) {
        console.error('Default icon generation failed:', defaultIconError);
        return sendJSONResponse(res, 500, {
          status: 'error',
          error: 'Failed to generate default icon',
          category: 'ICON_GENERATION_ERROR',
          solution: getMessage('iconGenerationSolution', lang),
          troubleshooting: getMessage('iconGenerationTroubleshooting', lang).split(', ')
        });
      }
    }

    // Auto-fetch favicon if no icon provided and website URL exists
    if (!req.files?.icon && config.websiteUrl) {
      try {
        const faviconBuffer = await fetchFavicon(config.websiteUrl);
        if (faviconBuffer) {
          const processedFavicon = await processIcon(faviconBuffer);
          await fs.writeFile(iconPath, processedFavicon);
          console.log('Favicon fetched and processed successfully');
        }
      } catch (faviconError) {
        console.log('Favicon fetch failed, using default icon:', faviconError.message);
      }
    }

    // Send immediate response
    // Immediately respond to frontend, tell it build has started
    sendJSONResponse(res, 202, {
      status: 'building',
      progress: 8,  // Perfect progress bar: Hard-coded initial progress at 8%
      buildId: buildId,
      message: 'Debug build accepted and started.',
      stage: 'ACCEPTED',
      timestamp: new Date().toISOString()
    });

    // Execute build in background and ensure final status is recorded
    executeDebugBuild(config, iconPath, outputDir)
      .then(result => {
        console.log(`Build ${buildId} finished with status: SUCCESS`);
        // Final safeguard: ensure the status file is written
        const finalResult = {
          status: 'success',
          buildId: buildId,
          config: config,
          buildTime: new Date().toISOString(),
          buildType: 'debug',
          apkPath: result.apkPath || path.join(outputDir, `${config.appName}.apk`),
          downloadUrl: `/download-apk/${buildId}`
        };
        return fs.writeFile(
          path.join(outputDir, 'build-result.json'),
          JSON.stringify(finalResult, null, 2)
        ).then(() => {
          console.log('Build result saved successfully');
        });
      })
      .catch(error => {
        console.error(`Build ${buildId} finished with status: FAILED. Error:`, error.message);
        // Final safeguard: ensure the error status file is written
        const errorResult = {
          status: 'error',
          buildId: buildId,
          error: error.message,
          config: config,
          buildTime: new Date().toISOString(),
          buildType: 'debug'
        };
        return fs.writeFile(
          path.join(outputDir, 'build-result.json'),
          JSON.stringify(errorResult, null, 2)
        ).catch(writeError => {
          console.error('Failed to write error result:', writeError);
        });
      });

  } catch (error) {
    console.error('Build initiation failed:', error);
    const cleanError = errorHandler.formatErrorForJSON(error.message);
    sendJSONResponse(res, 500, {
      status: 'error',
      error: cleanError,
      category: 'BUILD_INITIATION_ERROR',
      solution: getMessage('buildInitiationSolution', lang),
      troubleshooting: getMessage('buildInitiationTroubleshooting', lang).split(', ')
    });
  }
});

// Release build endpoint
app.post('/api/build-release', upload.fields([
  { name: 'icon', maxCount: 1 },
  { name: 'keystoreFile', maxCount: 1 }
]), async (req, res) => {
  const buildId = uuidv4();
  const outputDir = path.join(__dirname, 'downloads', buildId);

  try {
    await fs.mkdir(outputDir, { recursive: true });

    // Get language from request
    const lang = req.body.lang || 'en';

    const config = {
      appName: req.body.appName || 'My App',
      packageName: req.body.packageName || 'com.example.myapp',
      version: req.body.version || '1.0.0',
      websiteUrl: req.body.websiteUrl || '',
      statusBarColor: req.body.statusBarColor || '#4C2E85',
      keystorePassword: req.body.keystorePassword || '',
      keyAlias: req.body.keyAlias || '',
      keyPassword: req.body.keyPassword || req.body.keystorePassword
    };

    // Log color value reception
    console.log('Status bar color received (release):', req.body.statusBarColor, '-> Final:', config.statusBarColor);

    // Validate required fields for release build
    if (!config.appName.trim()) {
      return sendJSONResponse(res, 400, {
        status: 'error',
        error: 'App name is required',
        category: 'VALIDATION_ERROR',
        solution: getMessage('appNameSolution', lang),
        troubleshooting: getMessage('appNameTroubleshooting', lang).split(', ')
      });
    }

    if (!config.packageName.trim() || !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(config.packageName)) {
      return sendJSONResponse(res, 400, {
        status: 'error',
        error: 'Invalid package name format',
        category: 'VALIDATION_ERROR',
        solution: getMessage('packageNameSolution', lang),
        troubleshooting: getMessage('packageNameTroubleshooting', lang).split(', ')
      });
    }

    if (containsJavaKeywords(config.packageName)) {
      return sendJSONResponse(res, 400, {
        status: 'error',
        error: 'Package name contains Java keywords (like "final", "class", etc.). Please use different names.',
        category: 'VALIDATION_ERROR',
        solution: 'Change package name parts that are Java keywords to different names',
        troubleshooting: ['Avoid Java keywords like: final, class, interface, public, private, etc.', 'Use descriptive names like: com.mycompany.myapp']
      });
    }

    // Validate keystore requirements for release build
    if (!req.files?.keystoreFile || !req.files.keystoreFile[0]) {
      return sendJSONResponse(res, 400, {
        status: 'error',
        error: getMessage('invalidKeystore', lang),
        category: 'VALIDATION_ERROR',
        solution: getMessage('keystoreSolution', lang),
        troubleshooting: getMessage('keystoreTroubleshooting', lang).split(', ')
      });
    }

    if (!config.keystorePassword.trim()) {
      return sendJSONResponse(res, 400, {
        status: 'error',
        error: getMessage('invalidKeystorePassword', lang),
        category: 'VALIDATION_ERROR',
        solution: getMessage('keystorePasswordSolution', lang),
        troubleshooting: getMessage('keystorePasswordTroubleshooting', lang).split(', ')
      });
    }

    if (!config.keyAlias.trim()) {
      return sendJSONResponse(res, 400, {
        status: 'error',
        error: getMessage('invalidKeyAlias', lang),
        category: 'VALIDATION_ERROR',
        solution: getMessage('keyAliasSolution', lang),
        troubleshooting: getMessage('keyAliasTroubleshooting', lang).split(', ')
      });
    }

    // Process keystore file
    let keystorePath = null;
    if (req.files.keystoreFile && req.files.keystoreFile[0]) {
      keystorePath = path.join(__dirname, 'temp', `${buildId}-keystore.keystore`);
      await fs.copyFile(req.files.keystoreFile[0].path, keystorePath);

      // Clean up uploaded file
      await fs.unlink(req.files.keystoreFile[0].path);
    }

    // Process icon
    let iconPath = null;
    if (req.files && req.files.icon && req.files.icon[0]) {
      try {
        const iconBuffer = await processIcon(await fs.readFile(req.files.icon[0].path));
        iconPath = path.join(__dirname, 'temp', `${buildId}-icon.png`);
        await fs.writeFile(iconPath, iconBuffer);

        // Clean up uploaded file
        await fs.unlink(req.files.icon[0].path);
      } catch (iconError) {
        console.error('Icon processing failed:', iconError);
        return sendJSONResponse(res, 400, {
          status: 'error',
          error: 'Failed to process icon',
          category: 'ICON_PROCESSING_ERROR',
          solution: getMessage('iconProcessingSolution', lang),
          troubleshooting: getMessage('iconProcessingTroubleshooting', lang).split(', ')
        });
      }
    } else {
      // Generate default icon
      try {
        const defaultIconBuffer = await generateDefaultIcon();
        iconPath = path.join(__dirname, 'temp', `${buildId}-icon.png`);
        await fs.writeFile(iconPath, defaultIconBuffer);
      } catch (defaultIconError) {
        console.error('Default icon generation failed:', defaultIconError);
        return sendJSONResponse(res, 500, {
          status: 'error',
          error: 'Failed to generate default icon',
          category: 'ICON_GENERATION_ERROR',
          solution: getMessage('iconGenerationSolution', lang),
          troubleshooting: getMessage('iconGenerationTroubleshooting', lang).split(', ')
        });
      }
    }

    // Auto-fetch favicon if no icon provided and website URL exists
    if (!req.files?.icon && config.websiteUrl) {
      try {
        const faviconBuffer = await fetchFavicon(config.websiteUrl);
        if (faviconBuffer) {
          const processedFavicon = await processIcon(faviconBuffer);
          await fs.writeFile(iconPath, processedFavicon);
          console.log('Favicon fetched and processed successfully');
        }
      } catch (faviconError) {
        console.log('Favicon fetch failed, using default icon:', faviconError.message);
      }
    }

    // Immediately respond to frontend, tell it build has started
    sendJSONResponse(res, 202, {
      status: 'building',
      progress: 8,  // Perfect progress bar: Hard-coded initial progress at 8%
      buildId: buildId,
      message: 'Release build accepted and started.',
      stage: 'ACCEPTED',
      timestamp: new Date().toISOString()
    });

    // Execute build in background and ensure final status is recorded
    executeReleaseBuild(config, iconPath, keystorePath, outputDir)
      .then(result => {
        console.log(`Build ${buildId} finished with status: SUCCESS`);
        // Final safeguard: ensure the status file is written
        const finalResult = {
          status: 'success',
          buildId: buildId,
          config: config,
          buildTime: new Date().toISOString(),
          buildType: 'release',
          apkPath: result.apkPath || path.join(outputDir, `${config.appName}.apk`),
          downloadUrl: `/download-apk/${buildId}`
        };
        return fs.writeFile(
          path.join(outputDir, 'build-result.json'),
          JSON.stringify(finalResult, null, 2)
        ).then(() => {
          console.log('Build result saved successfully');
        });
      })
      .catch(error => {
        console.error(`Build ${buildId} finished with status: FAILED. Error:`, error.message);
        // Final safeguard: ensure the error status file is written
        const errorResult = {
          status: 'error',
          buildId: buildId,
          error: error.message,
          config: config,
          buildTime: new Date().toISOString(),
          buildType: 'release'
        };
        return fs.writeFile(
          path.join(outputDir, 'build-result.json'),
          JSON.stringify(errorResult, null, 2)
        ).catch(writeError => {
          console.error('Failed to write error result:', writeError);
        });
      });

  } catch (error) {
    console.error('Release build initiation failed:', error);
    const cleanError = errorHandler.formatErrorForJSON(error.message);
    sendJSONResponse(res, 500, {
      status: 'error',
      error: cleanError,
      category: 'BUILD_INITIATION_ERROR',
      solution: getMessage('buildInitiationSolution', lang),
      troubleshooting: getMessage('buildInitiationTroubleshooting', lang).split(', ')
    });
  }
});

// Build status endpoint
app.get('/api/build-status/:buildId', async (req, res) => {
  try {
    const { buildId } = req.params;
    const outputDir = path.join(__dirname, 'downloads', buildId);
    const buildResultPath = path.join(outputDir, 'build-result.json');

    try {
      const buildResult = JSON.parse(await fs.readFile(buildResultPath, 'utf8'));
      sendJSONResponse(res, 200, buildResult);
    } catch (error) {
      // Build result not found, build is still in progress
      sendJSONResponse(res, 200, {
        status: 'building',
        message: 'Build in progress...'
      });
    }
  } catch (error) {
    console.error('Build status check failed:', error);
    sendJSONResponse(res, 500, {
      status: 'error',
      error: 'Failed to check build status'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  const lang = req.headers['accept-language']?.includes('zh') ? 'zh' : 'en';

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendJSONResponse(res, 400, {
        status: 'error',
        error: 'File too large',
        category: 'FILE_SIZE_ERROR',
        solution: getMessage('fileSizeSolution', lang),
        troubleshooting: getMessage('fileSizeTroubleshooting', lang).split(', ')
      });
    }
    return sendJSONResponse(res, 400, {
      status: 'error',
      error: error.message,
      category: 'FILE_UPLOAD_ERROR',
      solution: getMessage('fileUploadErrorSolution', lang),
      troubleshooting: getMessage('fileUploadErrorTroubleshooting', lang).split(', ')
    });
  }

  const cleanError = errorHandler.formatErrorForJSON(error.message);
  sendJSONResponse(res, 500, {
    status: 'error',
    error: cleanError,
    category: 'INTERNAL_SERVER_ERROR',
    solution: getMessage('buildInitiationSolution', lang),
    troubleshooting: getMessage('buildInitiationTroubleshooting', lang).split(', ')
  });
});

// 404 handler
app.use((req, res) => {
  const lang = req.headers['accept-language']?.includes('zh') ? 'zh' : 'en';
  sendJSONResponse(res, 404, {
    status: 'error',
    error: 'Endpoint not found',
    category: 'NOT_FOUND_ERROR',
    solution: getMessage('endpointNotFoundSolution', lang),
    troubleshooting: getMessage('endpointNotFoundTroubleshooting', lang).split(', ')
  });
});

// Initialize directories and start server
const startServer = async () => {
  try {
    await ensureDirectories();
    console.log('Required directories created');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Web-to-APK server running on port ${PORT}`);
      console.log(`Visit http://localhost:${PORT} to use the service`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();