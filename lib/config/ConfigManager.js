import { WebToAPKError } from '../types/index.js';
import { ConfigParser } from './ConfigParser.js';
import { ConfigValidator } from './ConfigValidator.js';
import * as path from 'path';
/**
 * Main configuration management class for Web-to-APK converter
 * Handles loading, validation, and processing of application configurations
 */
export class ConfigManager {
    constructor(errorHandler) {
        this.parser = new ConfigParser();
        this.validator = new ConfigValidator();
        this.errorHandler = errorHandler;
    }
    /**
     * Load and validate configuration from file
     * @param configPath Path to configuration file
     * @returns Validated AppConfig object
     * @throws WebToAPKError if configuration is invalid
     */
    async loadConfig(configPath) {
        try {
            // Load configuration from file
            const config = this.parser.loadConfig(configPath);
            // Validate the configuration
            const validationResult = this.validator.validateConfig(config);
            // Handle validation results
            this.handleValidationResult(validationResult, configPath);
            return config;
        }
        catch (error) {
            if (error instanceof WebToAPKError) {
                this.errorHandler.handleConfigError(error);
                throw error;
            }
            const configError = new WebToAPKError('CONFIG', `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`, { path: configPath, originalError: error });
            this.errorHandler.handleConfigError(configError);
            throw configError;
        }
    }
    /**
     * Create and save a default configuration file
     * @param outputPath Path where to save the default configuration
     * @returns Default AppConfig object
     */
    createDefaultConfig(outputPath) {
        try {
            const defaultConfig = this.parser.createDefaultConfig();
            this.parser.saveConfig(defaultConfig, outputPath);
            return defaultConfig;
        }
        catch (error) {
            const configError = new WebToAPKError('CONFIG', `Failed to create default configuration: ${error instanceof Error ? error.message : String(error)}`, { path: outputPath, originalError: error });
            this.errorHandler.handleConfigError(configError);
            throw configError;
        }
    }
    /**
     * Validate configuration without loading from file
     * @param config Configuration object to validate
     * @returns ValidationResult with errors and warnings
     */
    validateConfig(config) {
        return this.validator.validateConfig(config);
    }
    /**
     * Generate Capacitor configuration from AppConfig
     * @param config Application configuration
     * @returns Capacitor configuration object
     */
    generateCapacitorConfig(config) {
        try {
            const capacitorConfig = {
                appId: config.packageName,
                appName: config.appName,
                webDir: config.webDir
            };
            // Add server configuration if startUrl is a remote URL
            if (config.startUrl.startsWith('http://') || config.startUrl.startsWith('https://')) {
                capacitorConfig.server = {
                    url: config.startUrl,
                    cleartext: config.startUrl.startsWith('http://')
                };
            }
            // Add plugins configuration
            if (config.plugins) {
                capacitorConfig.plugins = { ...config.plugins };
            }
            // Add default plugins if not specified
            if (!capacitorConfig.plugins) {
                capacitorConfig.plugins = {};
            }
            // Configure StatusBar plugin
            if (!capacitorConfig.plugins.StatusBar) {
                capacitorConfig.plugins.StatusBar = {
                    style: 'default',
                    backgroundColor: '#ffffff'
                };
            }
            // Configure SplashScreen plugin
            if (!capacitorConfig.plugins.SplashScreen) {
                capacitorConfig.plugins.SplashScreen = {
                    launchShowDuration: 2000,
                    backgroundColor: '#ffffff',
                    showSpinner: false
                };
            }
            // Configure App plugin for orientation
            if (config.orientation && config.orientation !== 'any') {
                capacitorConfig.plugins.App = {
                    ...capacitorConfig.plugins.App,
                    orientation: config.orientation
                };
            }
            return capacitorConfig;
        }
        catch (error) {
            const configError = new WebToAPKError('CONFIG', `Failed to generate Capacitor configuration: ${error instanceof Error ? error.message : String(error)}`, { config, originalError: error });
            this.errorHandler.handleConfigError(configError);
            throw configError;
        }
    }
    /**
     * Save Capacitor configuration to file
     * @param capacitorConfig Capacitor configuration object
     * @param outputPath Path where to save the configuration
     */
    async saveCapacitorConfig(capacitorConfig, outputPath) {
        try {
            const configContent = `import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = ${JSON.stringify(capacitorConfig, null, 2)};

export default config;
`;
            // Ensure the output directory exists
            const fs = await import('fs');
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            fs.writeFileSync(outputPath, configContent, 'utf-8');
        }
        catch (error) {
            const configError = new WebToAPKError('CONFIG', `Failed to save Capacitor configuration: ${error instanceof Error ? error.message : String(error)}`, { path: outputPath, originalError: error });
            this.errorHandler.handleConfigError(configError);
            throw configError;
        }
    }
    /**
     * Merge multiple configurations with priority
     * @param baseConfig Base configuration
     * @param overrideConfig Configuration to override base with
     * @returns Merged configuration
     */
    mergeConfigs(baseConfig, overrideConfig) {
        const merged = { ...baseConfig };
        // Merge simple properties
        Object.keys(overrideConfig).forEach(key => {
            const value = overrideConfig[key];
            if (value !== undefined) {
                if (key === 'permissions' && Array.isArray(value)) {
                    // Merge permissions arrays, removing duplicates
                    merged.permissions = [...new Set([...merged.permissions, ...value])];
                }
                else if (key === 'allowNavigation' && Array.isArray(value)) {
                    // Merge navigation URLs, removing duplicates
                    merged.allowNavigation = [...new Set([...(merged.allowNavigation || []), ...value])];
                }
                else if (key === 'plugins' && typeof value === 'object') {
                    // Deep merge plugins
                    merged.plugins = { ...merged.plugins, ...value };
                }
                else {
                    merged[key] = value;
                }
            }
        });
        return merged;
    }
    /**
     * Get user-friendly error message for configuration errors
     * @param error Configuration error
     * @returns User-friendly error message with suggestions
     */
    getErrorSolution(error) {
        return this.errorHandler.provideSolution(error);
    }
    /**
     * Handle validation results and provide user feedback
     * @param validationResult Result from configuration validation
     * @param configPath Path to the configuration file
     */
    handleValidationResult(validationResult, configPath) {
        // Log warnings
        if (validationResult.warnings.length > 0) {
            console.warn(`Configuration warnings for ${configPath}:`);
            validationResult.warnings.forEach(warning => {
                console.warn(`  - ${warning.field}: ${warning.message}`);
            });
        }
        // Throw error if validation failed
        if (!validationResult.isValid) {
            const errorMessages = validationResult.errors
                .map(error => `${error.field}: ${error.message}`)
                .join('\n  - ');
            const configError = new WebToAPKError('CONFIG', `Configuration validation failed:\n  - ${errorMessages}`, {
                path: configPath,
                errors: validationResult.errors,
                warnings: validationResult.warnings
            });
            throw configError;
        }
    }
    /**
     * Resolve relative paths in configuration relative to config file location
     * @param config Configuration object
     * @param configPath Path to the configuration file
     * @returns Configuration with resolved paths
     */
    resolveConfigPaths(config, configPath) {
        const configDir = path.dirname(configPath);
        const resolvedConfig = { ...config };
        // Resolve webDir path
        if (resolvedConfig.webDir && !path.isAbsolute(resolvedConfig.webDir)) {
            resolvedConfig.webDir = path.resolve(configDir, resolvedConfig.webDir);
        }
        // Resolve icon path
        if (resolvedConfig.icon && !path.isAbsolute(resolvedConfig.icon)) {
            resolvedConfig.icon = path.resolve(configDir, resolvedConfig.icon);
        }
        // Resolve splash screen path
        if (resolvedConfig.splashScreen && !path.isAbsolute(resolvedConfig.splashScreen)) {
            resolvedConfig.splashScreen = path.resolve(configDir, resolvedConfig.splashScreen);
        }
        return resolvedConfig;
    }
}
//# sourceMappingURL=ConfigManager.js.map