import { AppConfig, ValidationResult, ValidationError, ValidationWarning } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration validator for Web-to-APK converter
 * Validates configuration objects against requirements
 */
export class ConfigValidator {
  private readonly VALID_ORIENTATIONS = ['portrait', 'landscape', 'any'];
  private readonly PACKAGE_NAME_REGEX = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
  private readonly VERSION_REGEX = /^\d+\.\d+\.\d+$/;

  /**
   * Validate a complete AppConfig object
   * @param config Configuration object to validate
   * @returns ValidationResult with errors and warnings
   */
  public validateConfig(config: AppConfig): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate required fields
    this.validateRequiredFields(config, errors);

    // Validate field formats
    this.validateFieldFormats(config, errors, warnings);

    // Validate file paths
    this.validateFilePaths(config, errors, warnings);

    // Validate permissions
    this.validatePermissions(config, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate that all required fields are present and not empty
   */
  private validateRequiredFields(config: AppConfig, errors: ValidationError[]): void {
    const requiredFields: (keyof AppConfig)[] = [
      'appName',
      'packageName',
      'version',
      'webDir',
      'startUrl',
      'permissions'
    ];

    for (const field of requiredFields) {
      const value = config[field];
      if (value === undefined || value === null) {
        errors.push({
          field,
          message: `${field} is required`,
          severity: 'error'
        });
      } else if (typeof value === 'string' && value.trim() === '') {
        errors.push({
          field,
          message: `${field} cannot be empty`,
          severity: 'error'
        });
      } else if (Array.isArray(value) && value.length === 0) {
        errors.push({
          field,
          message: `${field} must contain at least one item`,
          severity: 'error'
        });
      }
    }
  }

  /**
   * Validate field formats and values
   */
  private validateFieldFormats(
    config: AppConfig,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Validate app name
    if (config.appName && config.appName.length > 50) {
      warnings.push({
        field: 'appName',
        message: 'App name is longer than 50 characters, may be truncated on some devices',
        severity: 'warning'
      });
    }

    // Validate package name
    if (config.packageName && !this.PACKAGE_NAME_REGEX.test(config.packageName)) {
      errors.push({
        field: 'packageName',
        message: 'Package name must follow Java package naming convention (e.g., com.example.app)',
        severity: 'error'
      });
    }

    // Validate version
    if (config.version && !this.VERSION_REGEX.test(config.version)) {
      errors.push({
        field: 'version',
        message: 'Version must follow semantic versioning format (e.g., 1.0.0)',
        severity: 'error'
      });
    }

    // Validate orientation
    if (config.orientation && !this.VALID_ORIENTATIONS.includes(config.orientation)) {
      errors.push({
        field: 'orientation',
        message: `Orientation must be one of: ${this.VALID_ORIENTATIONS.join(', ')}`,
        severity: 'error'
      });
    }

    // Validate startUrl
    if (config.startUrl) {
      if (config.startUrl.startsWith('http://') || config.startUrl.startsWith('https://')) {
        warnings.push({
          field: 'startUrl',
          message: 'Using remote URL as startUrl may cause issues if network is unavailable',
          severity: 'warning'
        });
      } else if (!config.startUrl.endsWith('.html') && !config.startUrl.includes('/')) {
        warnings.push({
          field: 'startUrl',
          message: 'startUrl should typically point to an HTML file',
          severity: 'warning'
        });
      }
    }
  }

  /**
   * Validate file paths exist
   */
  private validateFilePaths(
    config: AppConfig,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Validate webDir
    if (config.webDir && !fs.existsSync(config.webDir)) {
      errors.push({
        field: 'webDir',
        message: `Web directory does not exist: ${config.webDir}`,
        severity: 'error'
      });
    } else if (config.webDir && config.startUrl) {
      const startUrlPath = path.join(config.webDir, config.startUrl);
      if (!fs.existsSync(startUrlPath) && !config.startUrl.startsWith('http')) {
        warnings.push({
          field: 'startUrl',
          message: `Start URL file does not exist: ${startUrlPath}`,
          severity: 'warning'
        });
      }
    }

    // Validate icon path
    if (config.icon && !fs.existsSync(config.icon)) {
      warnings.push({
        field: 'icon',
        message: `Icon file does not exist: ${config.icon}`,
        severity: 'warning'
      });
    } else if (config.icon) {
      const ext = path.extname(config.icon).toLowerCase();
      if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
        warnings.push({
          field: 'icon',
          message: 'Icon should be a PNG or JPEG file for best compatibility',
          severity: 'warning'
        });
      }
    }

    // Validate splash screen path
    if (config.splashScreen && !fs.existsSync(config.splashScreen)) {
      warnings.push({
        field: 'splashScreen',
        message: `Splash screen file does not exist: ${config.splashScreen}`,
        severity: 'warning'
      });
    }
  }

  /**
   * Validate permissions array
   */
  private validatePermissions(config: AppConfig, warnings: ValidationWarning[]): void {
    if (!config.permissions || config.permissions.length === 0) {
      return;
    }

    // Check for unknown permissions
    for (const permission of config.permissions) {
      if (!permission.startsWith('android.permission.')) {
        warnings.push({
          field: 'permissions',
          message: `Permission "${permission}" does not follow Android permission naming convention`,
          severity: 'warning'
        });
      }
    }

    // Check for essential permissions
    const hasInternetPermission = config.permissions.includes('android.permission.INTERNET');
    const hasNetworkStatePermission = config.permissions.includes(
      'android.permission.ACCESS_NETWORK_STATE'
    );

    if (!hasInternetPermission) {
      warnings.push({
        field: 'permissions',
        message: 'Missing INTERNET permission - web content may not load properly',
        severity: 'warning'
      });
    }

    if (!hasNetworkStatePermission) {
      warnings.push({
        field: 'permissions',
        message: 'Missing ACCESS_NETWORK_STATE permission - network status detection may not work',
        severity: 'warning'
      });
    }
  }

  /**
   * Validate navigation URLs
   */
  public validateNavigationUrls(urls: string[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const url of urls) {
      try {
        new URL(url);
      } catch {
        // Check if it's a wildcard pattern
        if (!url.includes('*')) {
          errors.push({
            field: 'allowNavigation',
            message: `Invalid URL format: ${url}`,
            severity: 'error'
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
