import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { WebToAPKError } from '../types/index.js';
/**
 * Implementation of SplashScreenGenerator for generating Android app splash screens
 */
export class SplashScreenGenerator {
    constructor() {
        this.ANDROID_SPLASH_SIZES = [
            // Portrait splash screens
            { width: 320, height: 480, density: 'ldpi', folder: 'drawable-ldpi', orientation: 'portrait' },
            { width: 480, height: 800, density: 'mdpi', folder: 'drawable-mdpi', orientation: 'portrait' },
            { width: 720, height: 1280, density: 'hdpi', folder: 'drawable-hdpi', orientation: 'portrait' },
            {
                width: 960,
                height: 1600,
                density: 'xhdpi',
                folder: 'drawable-xhdpi',
                orientation: 'portrait'
            },
            {
                width: 1440,
                height: 2560,
                density: 'xxhdpi',
                folder: 'drawable-xxhdpi',
                orientation: 'portrait'
            },
            {
                width: 1920,
                height: 3840,
                density: 'xxxhdpi',
                folder: 'drawable-xxxhdpi',
                orientation: 'portrait'
            },
            // Landscape splash screens
            { width: 480, height: 320, density: 'ldpi', folder: 'drawable-ldpi', orientation: 'landscape' },
            { width: 800, height: 480, density: 'mdpi', folder: 'drawable-mdpi', orientation: 'landscape' },
            {
                width: 1280,
                height: 720,
                density: 'hdpi',
                folder: 'drawable-hdpi',
                orientation: 'landscape'
            },
            {
                width: 1600,
                height: 960,
                density: 'xhdpi',
                folder: 'drawable-xhdpi',
                orientation: 'landscape'
            },
            {
                width: 2560,
                height: 1440,
                density: 'xxhdpi',
                folder: 'drawable-xxhdpi',
                orientation: 'landscape'
            },
            {
                width: 3840,
                height: 1920,
                density: 'xxxhdpi',
                folder: 'drawable-xxxhdpi',
                orientation: 'landscape'
            }
        ];
    }
    /**
     * Process a single splash screen and generate all required Android sizes
     */
    async processSplashScreen(options) {
        const { inputPath, outputDir, backgroundColor = '#ffffff', generateAllSizes = true, scaleMode = 'contain', imageScale = 0.6, centerImage = true } = options;
        // Validate input splash screen
        const isValid = await this.validateSplashScreen(inputPath);
        if (!isValid) {
            throw new WebToAPKError('RESOURCE', `Invalid splash screen file: ${inputPath}`, {
                inputPath
            });
        }
        const results = [];
        const sizesToGenerate = generateAllSizes ? this.ANDROID_SPLASH_SIZES : this.getRequiredSizes();
        for (const size of sizesToGenerate) {
            try {
                const outputFolder = join(outputDir, size.folder);
                await fs.mkdir(outputFolder, { recursive: true });
                const fileName = size.orientation === 'portrait' ? 'splash_portrait.png' : 'splash_landscape.png';
                const outputPath = join(outputFolder, fileName);
                await this.generateSplashScreen(inputPath, outputPath, size.width, size.height, backgroundColor, scaleMode, imageScale, centerImage);
                results.push({
                    size,
                    outputPath,
                    success: true
                });
            }
            catch (error) {
                results.push({
                    size,
                    outputPath: '',
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return results;
    }
    /**
     * Validate if the input splash screen file is valid
     */
    async validateSplashScreen(splashPath) {
        try {
            // Check if file exists
            await fs.access(splashPath);
            // Check if it's a valid image using sharp
            const metadata = await sharp(splashPath).metadata();
            // Validate image properties
            if (!metadata.width || !metadata.height) {
                return false;
            }
            // Check minimum size (should be at least 480x800 for best quality)
            if (metadata.width < 480 || metadata.height < 800) {
                console.warn(`Warning: Splash screen ${splashPath} is smaller than recommended size (480x800). Current size: ${metadata.width}x${metadata.height}`);
            }
            // Check supported formats
            const supportedFormats = ['png', 'jpeg', 'jpg', 'webp', 'svg'];
            if (!supportedFormats.includes(metadata.format || '')) {
                return false;
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get all required Android splash screen sizes
     */
    getRequiredSizes() {
        // Return essential sizes only (not all densities)
        return this.ANDROID_SPLASH_SIZES.filter(size => ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi'].includes(size.density));
    }
    /**
     * Generate splash screen for specific dimensions and orientation
     */
    async generateSplashScreen(inputPath, outputPath, width, height, backgroundColor = '#ffffff', scaleMode = 'contain', imageScale = 0.6, centerImage = true) {
        try {
            // Get input image metadata
            const inputMetadata = await sharp(inputPath).metadata();
            const inputWidth = inputMetadata.width || 0;
            const inputHeight = inputMetadata.height || 0;
            // Calculate scaling based on scale mode and image scale factor
            let scaledWidth;
            let scaledHeight;
            if (scaleMode === 'fill') {
                // Fill the entire screen
                scaledWidth = width;
                scaledHeight = height;
            }
            else {
                // Calculate scaling to fit/cover the image within the splash screen
                const scaleX = (width * imageScale) / inputWidth;
                const scaleY = (height * imageScale) / inputHeight;
                let scale;
                if (scaleMode === 'cover') {
                    scale = Math.max(scaleX, scaleY);
                }
                else {
                    // contain (default)
                    scale = Math.min(scaleX, scaleY);
                }
                scaledWidth = Math.round(inputWidth * scale);
                scaledHeight = Math.round(inputHeight * scale);
            }
            // Calculate position based on centerImage option
            const left = centerImage ? Math.round((width - scaledWidth) / 2) : 0;
            const top = centerImage ? Math.round((height - scaledHeight) / 2) : 0;
            // Create background canvas
            const background = sharp({
                create: {
                    width,
                    height,
                    channels: 4,
                    background: backgroundColor
                }
            });
            // Resize input image and composite it onto the background
            const sharpFitMode = scaleMode === 'fill' ? 'fill' : scaleMode === 'cover' ? 'cover' : 'contain';
            const resizedImage = await sharp(inputPath)
                .resize(scaledWidth, scaledHeight, {
                fit: sharpFitMode,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
                .toBuffer();
            await background
                .composite([
                {
                    input: resizedImage,
                    left,
                    top
                }
            ])
                .png({
                quality: 90,
                compressionLevel: 6
            })
                .toFile(outputPath);
        }
        catch (error) {
            throw new WebToAPKError('RESOURCE', `Failed to generate splash screen: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                inputPath,
                outputPath,
                width,
                height,
                backgroundColor,
                scaleMode,
                imageScale,
                centerImage
            });
        }
    }
    /**
     * Get splash screen metadata information
     */
    async getSplashScreenMetadata(splashPath) {
        try {
            const metadata = await sharp(splashPath).metadata();
            return {
                width: metadata.width || 0,
                height: metadata.height || 0,
                format: metadata.format || 'unknown'
            };
        }
        catch (error) {
            throw new WebToAPKError('RESOURCE', `Failed to read splash screen metadata: ${error instanceof Error ? error.message : 'Unknown error'}`, { splashPath });
        }
    }
}
//# sourceMappingURL=SplashScreenGenerator.js.map