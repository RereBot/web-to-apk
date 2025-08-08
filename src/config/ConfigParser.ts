import { AppConfig, WebToAPKError } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration file parser for Web-to-APK converter
 * Handles loading and parsing of configuration files
 */
export class ConfigParser {
  /**
   * Load configuration from a JSON file
   * @param configPath Path to the configuration file
   * @returns Parsed AppConfig object
   * @throws WebToAPKError if file cannot be read or parsed
   */
  public loadConfig(configPath: string): AppConfig {
    try {
      if (!fs.existsSync(configPath)) {
        throw new WebToAPKError('CONFIG', `Configuration file not found: ${configPath}`, {
          path: configPath
        });
      }

      const configContent = fs.readFileSync(configPath, 'utf-8');
      const parsedConfig = JSON.parse(configContent);

      return this.normalizeConfig(parsedConfig);
    } catch (error) {
      if (error instanceof WebToAPKError) {
        throw error;
      }

      if (error instanceof SyntaxError) {
        throw new WebToAPKError('CONFIG', `Invalid JSON in configuration file: ${error.message}`, {
          path: configPath,
          originalError: error
        });
      }

      throw new WebToAPKError(
        'CONFIG',
        `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`,
        { path: configPath, originalError: error }
      );
    }
  }

  /**
   * Normalize configuration object to ensure all required fields are present
   * @param config Raw configuration object
   * @returns Normalized AppConfig object
   */
  private normalizeConfig(config: any): AppConfig {
    // Set default values for optional fields
    const normalized: AppConfig = {
      appName: config.appName || 'My Web App',
      packageName: config.packageName || 'com.example.mywebapp',
      version: config.version || '1.0.0',
      webDir: config.webDir || './dist',
      startUrl: config.startUrl || 'index.html',
      permissions: config.permissions || [
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE'
      ],
      orientation: config.orientation || 'any',
      icon: config.icon,
      splashScreen: config.splashScreen,
      allowNavigation: config.allowNavigation,
      plugins: config.plugins
    };

    return normalized;
  }

  /**
   * Create a default configuration object
   * @returns Default AppConfig object
   */
  public createDefaultConfig(): AppConfig {
    return {
      appName: 'My Web App',
      packageName: 'com.example.mywebapp',
      version: '1.0.0',
      webDir: './dist',
      startUrl: 'index.html',
      permissions: ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'],
      orientation: 'any'
    };
  }

  /**
   * Save configuration to a JSON file
   * @param config Configuration object to save
   * @param outputPath Path where to save the configuration
   */
  public saveConfig(config: AppConfig, outputPath: string): void {
    try {
      const configDir = path.dirname(outputPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      const configJson = JSON.stringify(config, null, 2);
      fs.writeFileSync(outputPath, configJson, 'utf-8');
    } catch (error) {
      throw new WebToAPKError(
        'CONFIG',
        `Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`,
        { path: outputPath, originalError: error }
      );
    }
  }
}
