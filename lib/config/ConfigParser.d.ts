import { AppConfig } from '../types/index.js';
/**
 * Configuration file parser for Web-to-APK converter
 * Handles loading and parsing of configuration files
 */
export declare class ConfigParser {
    /**
     * Load configuration from a JSON file
     * @param configPath Path to the configuration file
     * @returns Parsed AppConfig object
     * @throws WebToAPKError if file cannot be read or parsed
     */
    loadConfig(configPath: string): AppConfig;
    /**
     * Normalize configuration object to ensure all required fields are present
     * @param config Raw configuration object
     * @returns Normalized AppConfig object
     */
    private normalizeConfig;
    /**
     * Create a default configuration object
     * @returns Default AppConfig object
     */
    createDefaultConfig(): AppConfig;
    /**
     * Save configuration to a JSON file
     * @param config Configuration object to save
     * @param outputPath Path where to save the configuration
     */
    saveConfig(config: AppConfig, outputPath: string): void;
}
//# sourceMappingURL=ConfigParser.d.ts.map