import { CopyResult, PathTransformOptions, ValidationResult } from '../types/index.js';
/**
 * Interface for copying and organizing web resources for Android app
 */
export interface WebResourceCopier {
    /**
     * Copy web resources from source directory to target directory
     */
    copyWebResources(sourceDir: string, targetDir: string): Promise<CopyResult>;
    /**
     * Validate web resource directory structure and files
     */
    validateWebResources(webDir: string): Promise<ValidationResult>;
    /**
     * Transform relative paths in HTML/CSS/JS files for mobile app context
     */
    transformResourcePaths(filePath: string, transformOptions?: PathTransformOptions): Promise<void>;
    /**
     * Get list of all web resource files in directory
     */
    getWebResourceFiles(webDir: string): Promise<string[]>;
}
//# sourceMappingURL=WebResourceCopier.d.ts.map