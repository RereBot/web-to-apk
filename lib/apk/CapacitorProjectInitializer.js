import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { WebToAPKError } from '../types/index.js';
import { ResourceProcessorImpl } from '../resources/ResourceProcessor.js';
/**
 * Implementation of Capacitor project initialization
 */
export class CapacitorProjectInitializerImpl {
    constructor() {
        this.resourceProcessor = new ResourceProcessorImpl();
    }
    /**
     * Create a new Capacitor project structure
     */
    async createProject(config, projectPath) {
        try {
            // Ensure project directory exists
            await fs.mkdir(projectPath, { recursive: true });
            // Create basic project structure
            await this.createProjectStructure(projectPath);
            // Generate package.json
            await this.generatePackageJson(config, projectPath);
            // Generate Capacitor configuration
            await this.generateCapacitorConfig(config, projectPath);
            // Copy web assets if they exist
            if (config.webDir) {
                await this.copyWebAssets(config.webDir, join(projectPath, 'www'));
            }
            // Process resources (icons and splash screens)
            await this.processResources(config, projectPath);
        }
        catch (error) {
            throw new WebToAPKError('BUILD', `Failed to create Capacitor project: ${error instanceof Error ? error.message : String(error)}`, { projectPath, config });
        }
    }
    /**
     * Generate Capacitor configuration file
     */
    async generateCapacitorConfig(config, projectPath) {
        const capacitorConfig = {
            appId: config.packageName,
            appName: config.appName,
            webDir: 'www',
            plugins: config.plugins || {}
        };
        // Add server configuration if needed
        if (config.startUrl && config.startUrl.startsWith('http')) {
            capacitorConfig.server = {
                url: config.startUrl,
                cleartext: true
            };
        }
        const configPath = join(projectPath, 'capacitor.config.ts');
        const configContent = `import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = ${JSON.stringify(capacitorConfig, null, 2)};

export default config;
`;
        await fs.writeFile(configPath, configContent, 'utf-8');
    }
    /**
     * Add Android platform to the project
     */
    async addAndroidPlatform(projectPath) {
        try {
            // Verify Android SDK environment before proceeding
            await this.verifyAndroidEnvironment();
            // Change to project directory and add Android platform
            const originalCwd = process.cwd();
            process.chdir(projectPath);
            try {
                // Set environment variables for the command
                const env = {
                    ...process.env,
                    ANDROID_SDK_ROOT: process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME,
                    ANDROID_HOME: process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT,
                    JAVA_HOME: process.env.JAVA_HOME,
                    PATH: process.env.PATH
                };
                execSync('npx cap add android', {
                    stdio: 'pipe',
                    encoding: 'utf-8',
                    env: env
                });
            }
            finally {
                process.chdir(originalCwd);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new WebToAPKError('BUILD', `Failed to add Android platform: ${errorMessage}`, {
                projectPath,
                androidSdkRoot: process.env.ANDROID_SDK_ROOT,
                androidHome: process.env.ANDROID_HOME,
                javaHome: process.env.JAVA_HOME
            });
        }
    }
    /**
     * Verify Android development environment
     */
    async verifyAndroidEnvironment() {
        const errors = [];
        // Check JAVA_HOME
        if (!process.env.JAVA_HOME) {
            errors.push('JAVA_HOME environment variable is not set');
        }
        else {
            try {
                execSync('java -version', { stdio: 'pipe' });
            }
            catch {
                errors.push('Java is not accessible or not properly installed');
            }
        }
        // Check Android SDK
        const androidSdk = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
        if (!androidSdk) {
            errors.push('ANDROID_SDK_ROOT or ANDROID_HOME environment variable is not set');
        }
        else {
            const fsSync = await import('node:fs');
            if (!fsSync.existsSync(androidSdk)) {
                errors.push(`Android SDK directory does not exist: ${androidSdk}`);
            }
        }
        // Check if sdkmanager is available
        try {
            execSync('sdkmanager --version', { stdio: 'pipe' });
        }
        catch {
            errors.push('Android SDK command line tools (sdkmanager) are not available');
        }
        if (errors.length > 0) {
            throw new WebToAPKError('BUILD', 'Android development environment is not properly configured', { errors });
        }
    }
    /**
     * Install required plugins and dependencies
     */
    async installDependencies(projectPath, plugins = []) {
        try {
            const originalCwd = process.cwd();
            process.chdir(projectPath);
            try {
                // Install core Capacitor packages first
                execSync('npm install @capacitor/core@^6.0.0 @capacitor/cli@^5.7.0 @capacitor/android@^6.0.0', {
                    stdio: 'pipe',
                    encoding: 'utf-8'
                });
                // Install npm dependencies from package.json
                execSync('npm install', {
                    stdio: 'pipe',
                    encoding: 'utf-8'
                });
                // Install additional plugins if specified
                if (plugins.length > 0) {
                    const pluginList = plugins.join(' ');
                    execSync(`npm install ${pluginList}`, {
                        stdio: 'pipe',
                        encoding: 'utf-8'
                    });
                }
            }
            finally {
                process.chdir(originalCwd);
            }
        }
        catch (error) {
            throw new WebToAPKError('BUILD', `Failed to install dependencies: ${error instanceof Error ? error.message : String(error)}`, { projectPath, plugins });
        }
    }
    /**
     * Sync web assets to native project
     */
    async syncProject(projectPath) {
        try {
            const originalCwd = process.cwd();
            process.chdir(projectPath);
            try {
                execSync('npx cap sync android', {
                    stdio: 'pipe',
                    encoding: 'utf-8'
                });
            }
            finally {
                process.chdir(originalCwd);
            }
        }
        catch (error) {
            throw new WebToAPKError('BUILD', `Failed to sync project: ${error instanceof Error ? error.message : String(error)}`, { projectPath });
        }
    }
    /**
     * Create basic project directory structure
     */
    async createProjectStructure(projectPath) {
        const directories = ['www', 'src', 'android'];
        for (const dir of directories) {
            await fs.mkdir(join(projectPath, dir), { recursive: true });
        }
    }
    /**
     * Generate package.json for the Capacitor project
     */
    async generatePackageJson(config, projectPath) {
        const packageJson = {
            name: config.packageName.toLowerCase().replace(/\./g, '-'),
            version: config.version,
            description: `${config.appName} - Generated by Web-to-APK`,
            main: 'index.js',
            scripts: {
                build: 'cap sync',
                open: 'cap open android',
                sync: 'cap sync android'
            },
            dependencies: {
                '@capacitor/core': '^6.0.0',
                '@capacitor/android': '^6.0.0'
            },
            devDependencies: {
                '@capacitor/cli': '^5.7.0'
            }
        };
        await fs.writeFile(join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');
    }
    /**
     * Copy web assets to the project www directory
     */
    async copyWebAssets(sourceDir, targetDir) {
        try {
            await fs.mkdir(targetDir, { recursive: true });
            // Simple recursive copy implementation
            await this.copyDirectory(sourceDir, targetDir);
        }
        catch (error) {
            throw new WebToAPKError('RESOURCE', `Failed to copy web assets: ${error instanceof Error ? error.message : String(error)}`, { sourceDir, targetDir });
        }
    }
    /**
     * Recursively copy directory contents
     */
    async copyDirectory(source, target) {
        const entries = await fs.readdir(source, { withFileTypes: true });
        for (const entry of entries) {
            const sourcePath = join(source, entry.name);
            const targetPath = join(target, entry.name);
            if (entry.isDirectory()) {
                await fs.mkdir(targetPath, { recursive: true });
                await this.copyDirectory(sourcePath, targetPath);
            }
            else {
                await fs.copyFile(sourcePath, targetPath);
            }
        }
    }
    /**
     * Process application resources (icons and splash screens)
     */
    async processResources(config, projectPath) {
        try {
            const androidResourcesPath = join(projectPath, 'android', 'app', 'src', 'main', 'res');
            // Ensure Android resources directory exists
            await fs.mkdir(androidResourcesPath, { recursive: true });
            // Process app icon if provided
            if (config.icon) {
                console.log('Processing app icon...');
                try {
                    await this.resourceProcessor.processIcon(config.icon, androidResourcesPath);
                }
                catch (error) {
                    console.warn(`Warning: Failed to process icon: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            // Process splash screen if provided
            if (config.splashScreen) {
                console.log('Processing splash screen...');
                try {
                    await this.resourceProcessor.generateSplashScreens(config.splashScreen, androidResourcesPath);
                }
                catch (error) {
                    console.warn(`Warning: Failed to process splash screen: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }
        catch (error) {
            // Don't fail the entire project creation if resource processing fails
            console.warn(`Warning: Resource processing failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
//# sourceMappingURL=CapacitorProjectInitializer.js.map