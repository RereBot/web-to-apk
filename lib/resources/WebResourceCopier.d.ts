import { WebResourceCopier as IWebResourceCopier } from '../interfaces/WebResourceCopier.js';
import { CopyResult, PathTransformOptions, ValidationResult } from '../types/index.js';
/**
 * Implementation of WebResourceCopier for copying and organizing web resources
 */
export declare class WebResourceCopier implements IWebResourceCopier {
    private readonly SUPPORTED_EXTENSIONS;
    private readonly TRANSFORMABLE_EXTENSIONS;
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
    /**
     * Recursively scan directory for web resource files
     */
    private scanDirectory;
    /**
     * Transform paths in HTML content
     */
    private transformHtmlPaths;
    /**
     * Transform paths in CSS content
     */
    private transformCssPaths;
    /**
     * Transform paths in JavaScript content
     */
    private transformJsPaths;
    /**
     * Transform a single path attribute
     */
    private transformPath;
    /**
     * Transform CSS urls within a matched string
     */
    private transformCssUrlsInMatch;
    /**
     * Apply path transformation based on options
     */
    private applyPathTransform;
}
//# sourceMappingURL=WebResourceCopier.d.ts.map