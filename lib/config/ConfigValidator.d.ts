import { AppConfig, ValidationResult } from '../types/index.js';
/**
 * Configuration validator for Web-to-APK converter
 * Validates configuration objects against requirements
 */
export declare class ConfigValidator {
    private readonly VALID_ORIENTATIONS;
    private readonly PACKAGE_NAME_REGEX;
    private readonly VERSION_REGEX;
    /**
     * Validate a complete AppConfig object
     * @param config Configuration object to validate
     * @returns ValidationResult with errors and warnings
     */
    validateConfig(config: AppConfig): ValidationResult;
    /**
     * Validate that all required fields are present and not empty
     */
    private validateRequiredFields;
    /**
     * Validate field formats and values
     */
    private validateFieldFormats;
    /**
     * Validate file paths exist
     */
    private validateFilePaths;
    /**
     * Validate permissions array
     */
    private validatePermissions;
    /**
     * Validate navigation URLs
     */
    validateNavigationUrls(urls: string[]): ValidationResult;
}
//# sourceMappingURL=ConfigValidator.d.ts.map