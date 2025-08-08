import { ResourceProcessor } from '../interfaces/ResourceProcessor.js';
/**
 * Implementation of ResourceProcessor that coordinates all resource processing tasks
 */
export declare class ResourceProcessorImpl implements ResourceProcessor {
    private iconProcessor;
    private splashScreenGenerator;
    private webResourceCopier;
    private logger;
    constructor();
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