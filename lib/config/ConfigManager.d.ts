import { AppConfig, CapacitorConfig, ValidationResult, WebToAPKError } from '../types/index.js';
import { ErrorHandler } from '../interfaces/ErrorHandler.js';
/**
 * Main configuration management class for Web-to-APK converter
 * Handles loading, validation, and processing of application configurations
 */
export declare class ConfigManager {
    private parser;
    private validator;
    private errorHandler;
    constructor(errorHandler: ErrorHandler);
    /**
     * Load and validate configuration from file
     * @param configPath Path to configuration file
     * @returns Validated AppConfig object
     * @throws WebToAPKError if configuration is invalid
     */
    loadConfig(configPath: string): Promise<AppConfig>;
    /**
     * Create and save a default configuration file
     * @param outputPath Path where to save the default configuration
     * @returns Default AppConfig object
     */
    createDefaultConfig(outputPath: string): AppConfig;
    /**
     * Validate configuration without loading from file
     * @param config Configuration object to validate
     * @returns ValidationResult with errors and warnings
     */
    validateConfig(config: AppConfig): ValidationResult;
    /**
     * Generate Capacitor configuration from AppConfig
     * @param config Application configuration
     * @returns Capacitor configuration object
     */
    generateCapacitorConfig(config: AppConfig): CapacitorConfig;
    /**
     * Save Capacitor configuration to file
     * @param capacitorConfig Capacitor configuration object
     * @param outputPath Path where to save the configuration
     */
    saveCapacitorConfig(capacitorConfig: CapacitorConfig, outputPath: string): Promise<void>;
    /**
     * Merge multiple configurations with priority
     * @param baseConfig Base configuration
     * @param overrideConfig Configuration to override base with
     * @returns Merged configuration
     */
    mergeConfigs(baseConfig: AppConfig, overrideConfig: Partial<AppConfig>): AppConfig;
    /**
     * Get user-friendly error message for configuration errors
     * @param error Configuration error
     * @returns User-friendly error message with suggestions
     */
    getErrorSolution(error: WebToAPKError): string;
    /**
     * Handle validation results and provide user feedback
     * @param validationResult Result from configuration validation
     * @param configPath Path to the configuration file
     */
    private handleValidationResult;
    /**
     * Resolve relative paths in configuration relative to config file location
     * @param config Configuration object
     * @param configPath Path to the configuration file
     * @returns Configuration with resolved paths
     */
    resolveConfigPaths(config: AppConfig, configPath: string): AppConfig;
}
//# sourceMappingURL=ConfigManager.d.ts.map