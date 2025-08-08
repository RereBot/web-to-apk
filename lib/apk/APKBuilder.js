import { WebToAPKError } from '../types/index.js';
import { CapacitorProjectInitializerImpl } from './CapacitorProjectInitializer.js';
import { APKSignerImpl } from './APKSigner.js';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
/**
 * Main APK builder implementation
 */
export class APKBuilderImpl {
    constructor() {
        this.projectInitializer = new CapacitorProjectInitializerImpl();
        this.apkSigner = new APKSignerImpl();
    }
    /**
     * Initialize a new Capacitor project with the given configuration
     */
    async initializeProject(config, projectPath) {
        try {
            // Validate configuration
            this.validateConfig(config);
            // Create project structure
            await this.projectInitializer.createProject(config, projectPath);
            // Install dependencies
            await this.projectInitializer.installDependencies(projectPath);
            // Add Android platform
            await this.projectInitializer.addAndroidPlatform(projectPath);
            // Sync project
            await this.projectInitializer.syncProject(projectPath);
        }
        catch (error) {
            if (error instanceof WebToAPKError) {
                throw error;
            }
            throw new WebToAPKError('BUILD', `Failed to initialize project: ${error instanceof Error ? error.message : String(error)}`, { config, projectPath });
        }
    }
    /**
     * Build APK from the initialized project
     */
    async buildAPK(projectPath, options) {
        try {
            // Validate project structure
            await this.validateProjectStructure(projectPath);
            // Sync web assets before building
            await this.projectInitializer.syncProject(projectPath);
            // Determine build type and gradle task
            const buildType = options.release ? 'release' : 'debug';
            const gradleTask = options.release ? 'assembleRelease' : 'assembleDebug';
            console.log(`Starting ${buildType} build for project at ${projectPath}`);
            // Execute Gradle build
            await this.executeGradleBuild(projectPath, gradleTask, options);
            // Find and return the APK path
            const apkPath = await this.findBuiltAPK(projectPath, buildType);
            // Copy APK to output directory if specified
            if (options.outputDir) {
                const outputPath = await this.copyAPKToOutput(apkPath, options.outputDir, buildType);
                console.log(`APK built successfully: ${outputPath}`);
                return outputPath;
            }
            console.log(`APK built successfully: ${apkPath}`);
            return apkPath;
        }
        catch (error) {
            if (error instanceof WebToAPKError) {
                throw error;
            }
            throw new WebToAPKError('BUILD', `Failed to build APK: ${error instanceof Error ? error.message : String(error)}`, { projectPath, options });
        }
    }
    /**
     * Sign the APK with the provided keystore configuration
     */
    async signAPK(apkPath, keystoreConfig) {
        try {
            // Validate APK path
            await fs.access(apkPath);
            // If no keystore config provided, use debug keystore
            if (!keystoreConfig) {
                console.log('No keystore configuration provided, using debug keystore for signing...');
                return await this.apkSigner.signAPKWithDebugKeystore(apkPath);
            }
            // Use provided keystore configuration
            console.log('Signing APK with provided keystore configuration...');
            return await this.apkSigner.signAPK(apkPath, keystoreConfig);
        }
        catch (error) {
            if (error instanceof WebToAPKError) {
                throw error;
            }
            throw new WebToAPKError('SIGNING', `Failed to sign APK: ${error instanceof Error ? error.message : String(error)}`, {
                apkPath,
                keystoreConfig: keystoreConfig
                    ? { ...keystoreConfig, password: '***', aliasPassword: '***' }
                    : undefined
            });
        }
    }
    /**
     * Validate the application configuration
     */
    validateConfig(config) {
        const requiredFields = ['appName', 'packageName', 'version'];
        const missingFields = requiredFields.filter(field => !config[field]);
        if (missingFields.length > 0) {
            throw new WebToAPKError('CONFIG', `Missing required configuration fields: ${missingFields.join(', ')}`, { missingFields, config });
        }
        // Validate package name format
        if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(config.packageName)) {
            throw new WebToAPKError('CONFIG', 'Invalid package name format. Must be in format com.example.app', { packageName: config.packageName });
        }
        // Validate version format
        if (!/^\d+\.\d+\.\d+$/.test(config.version)) {
            throw new WebToAPKError('CONFIG', 'Invalid version format. Must be in format x.y.z', {
                version: config.version
            });
        }
    }
    /**
     * Validate that the project structure exists and is valid
     */
    async validateProjectStructure(projectPath) {
        try {
            // Check if project directory exists
            await fs.access(projectPath);
            // Check for essential Capacitor files
            const requiredFiles = [
                'capacitor.config.ts',
                'android/app/build.gradle',
                'android/build.gradle',
                'android/gradle.properties'
            ];
            for (const file of requiredFiles) {
                const filePath = path.join(projectPath, file);
                try {
                    await fs.access(filePath);
                }
                catch {
                    throw new WebToAPKError('BUILD', `Required file not found: ${file}. Please ensure the project is properly initialized.`, { projectPath, missingFile: file });
                }
            }
            // Check if Android platform is added
            const androidPath = path.join(projectPath, 'android');
            try {
                await fs.access(androidPath);
            }
            catch {
                throw new WebToAPKError('BUILD', 'Android platform not found. Please run project initialization first.', { projectPath });
            }
        }
        catch (error) {
            if (error instanceof WebToAPKError) {
                throw error;
            }
            throw new WebToAPKError('BUILD', `Project validation failed: ${error instanceof Error ? error.message : String(error)}`, { projectPath });
        }
    }
    /**
     * Execute Gradle build with proper logging and error handling
     */
    async executeGradleBuild(projectPath, gradleTask, options) {
        return new Promise((resolve, reject) => {
            const androidPath = path.join(projectPath, 'android');
            const isWindows = process.platform === 'win32';
            const gradleCommand = isWindows ? 'gradlew.bat' : './gradlew';
            // Build gradle arguments
            const args = [gradleTask];
            // Add additional options for release builds
            if (options.release) {
                args.push('--stacktrace');
            }
            else {
                args.push('--info');
            }
            // Add minification option if specified
            if (options.minifyWeb) {
                args.push('-PminifyEnabled=true');
            }
            console.log(`Executing: ${gradleCommand} ${args.join(' ')}`);
            console.log(`Working directory: ${androidPath}`);
            const gradleProcess = spawn(gradleCommand, args, {
                cwd: androidPath,
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: isWindows
            });
            let stdout = '';
            let stderr = '';
            // Handle stdout with real-time logging
            gradleProcess.stdout?.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                // Log important build progress
                const lines = output.split('\n');
                lines.forEach(line => {
                    if (line.includes('BUILD SUCCESSFUL') ||
                        line.includes('BUILD FAILED') ||
                        line.includes('> Task :') ||
                        line.includes('FAILURE:') ||
                        line.includes('ERROR:')) {
                        console.log(`[Gradle] ${line.trim()}`);
                    }
                });
            });
            // Handle stderr with error logging
            gradleProcess.stderr?.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                // Log errors and warnings
                const lines = output.split('\n');
                lines.forEach(line => {
                    if (line.trim()) {
                        console.error(`[Gradle Error] ${line.trim()}`);
                    }
                });
            });
            // Handle process completion
            gradleProcess.on('close', code => {
                if (code === 0) {
                    console.log('Gradle build completed successfully');
                    resolve();
                }
                else {
                    const errorMessage = this.parseGradleError(stderr, stdout);
                    reject(new WebToAPKError('BUILD', `Gradle build failed with exit code ${code}: ${errorMessage}`, {
                        exitCode: code,
                        stdout: stdout.slice(-1000), // Last 1000 chars
                        stderr: stderr.slice(-1000),
                        gradleTask,
                        projectPath
                    }));
                }
            });
            // Handle process errors
            gradleProcess.on('error', error => {
                reject(new WebToAPKError('BUILD', `Failed to start Gradle process: ${error.message}`, {
                    error: error.message,
                    gradleCommand,
                    androidPath
                }));
            });
            // Set timeout for build process (10 minutes)
            const timeout = setTimeout(() => {
                gradleProcess.kill('SIGTERM');
                reject(new WebToAPKError('BUILD', 'Gradle build timed out after 10 minutes', {
                    gradleTask,
                    projectPath
                }));
            }, 10 * 60 * 1000);
            gradleProcess.on('close', () => {
                clearTimeout(timeout);
            });
        });
    }
    /**
     * Parse Gradle error output to provide meaningful error messages
     */
    parseGradleError(stderr, stdout) {
        const combinedOutput = stderr + stdout;
        // Common Gradle error patterns
        const errorPatterns = [
            {
                pattern: /FAILURE: Build failed with an exception/,
                message: 'Build failed with exception'
            },
            {
                pattern: /Could not resolve all files for configuration/,
                message: 'Dependency resolution failed. Check your internet connection and dependencies.'
            },
            {
                pattern: /Android SDK not found/,
                message: 'Android SDK not found. Please install Android SDK and set ANDROID_HOME environment variable.'
            },
            {
                pattern: /No toolchains found in the NDK toolchains folder/,
                message: 'Android NDK issue. Please check your NDK installation.'
            },
            {
                pattern: /Execution failed for task.*:compileDebugJavaWithJavac/,
                message: 'Java compilation failed. Check for syntax errors in generated code.'
            },
            {
                pattern: /Execution failed for task.*:packageDebug/,
                message: 'APK packaging failed. Check for resource conflicts or missing files.'
            }
        ];
        for (const { pattern, message } of errorPatterns) {
            if (pattern.test(combinedOutput)) {
                return message;
            }
        }
        // Extract the first error line if no pattern matches
        const errorLines = combinedOutput
            .split('\n')
            .filter(line => line.includes('ERROR:') || line.includes('FAILURE:') || line.includes('Exception:'));
        if (errorLines.length > 0) {
            return errorLines[0].trim();
        }
        return 'Unknown build error occurred';
    }
    /**
     * Find the built APK file in the project output directory
     */
    async findBuiltAPK(projectPath, buildType) {
        const apkDir = path.join(projectPath, 'android', 'app', 'build', 'outputs', 'apk', buildType);
        try {
            const files = await fs.readdir(apkDir);
            const apkFiles = files.filter(file => file.endsWith('.apk'));
            if (apkFiles.length === 0) {
                throw new WebToAPKError('BUILD', `No APK files found in ${apkDir}`, { apkDir, buildType });
            }
            // Return the first APK file found (usually there's only one)
            const apkPath = path.join(apkDir, apkFiles[0]);
            // Verify the APK file exists and is not empty
            const stats = await fs.stat(apkPath);
            if (stats.size === 0) {
                throw new WebToAPKError('BUILD', `APK file is empty: ${apkPath}`, {
                    apkPath,
                    size: stats.size
                });
            }
            return apkPath;
        }
        catch (error) {
            if (error instanceof WebToAPKError) {
                throw error;
            }
            throw new WebToAPKError('BUILD', `Failed to find built APK: ${error instanceof Error ? error.message : String(error)}`, { apkDir, buildType });
        }
    }
    /**
     * Copy APK to the specified output directory
     */
    async copyAPKToOutput(apkPath, outputDir, buildType) {
        try {
            // Ensure output directory exists
            await fs.mkdir(outputDir, { recursive: true });
            // Generate output filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const apkFileName = `app-${buildType}-${timestamp}.apk`;
            const outputPath = path.join(outputDir, apkFileName);
            // Copy the APK file
            await fs.copyFile(apkPath, outputPath);
            // Verify the copied file
            const stats = await fs.stat(outputPath);
            if (stats.size === 0) {
                throw new WebToAPKError('BUILD', `Copied APK file is empty: ${outputPath}`, {
                    outputPath,
                    originalPath: apkPath
                });
            }
            return outputPath;
        }
        catch (error) {
            if (error instanceof WebToAPKError) {
                throw error;
            }
            throw new WebToAPKError('BUILD', `Failed to copy APK to output directory: ${error instanceof Error ? error.message : String(error)}`, { apkPath, outputDir, buildType });
        }
    }
}
//# sourceMappingURL=APKBuilder.js.map