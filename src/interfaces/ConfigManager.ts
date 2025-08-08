import { AppConfig, CapacitorConfig, ValidationResult } from '../types/index.js';

/**
 * Interface for configuration management
 */
export interface ConfigManager {
  /**
   * Load configuration from a file path
   */
  loadConfig(configPath: string): Promise<AppConfig>;

  /**
   * Validate the provided configuration
   */
  validateConfig(config: AppConfig): ValidationResult;

  /**
   * Generate Capacitor configuration from app config
   */
  generateCapacitorConfig(config: AppConfig): CapacitorConfig;
}
