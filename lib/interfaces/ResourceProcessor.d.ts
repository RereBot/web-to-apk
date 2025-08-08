/**
 * Interface for resource processing (icons, splash screens, web assets)
 */
export interface ResourceProcessor {
    /**
     * Process and generate icon files for different resolutions
     */
    processIcon(iconPath: string, outputDir: string): Promise<void>;
    /**
     * Generate splash screen resources for different screen densities
     */
    generateSplashScreens(splashPath: string, outputDir: string): Promise<void>;
    /**
     * Copy web assets to the output directory
     */
    copyWebAssets(webDir: string, outputDir: string): Promise<void>;
}
//# sourceMappingURL=ResourceProcessor.d.ts.map