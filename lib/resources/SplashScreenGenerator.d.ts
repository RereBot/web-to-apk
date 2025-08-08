import { SplashScreenGenerator as ISplashScreenGenerator } from '../interfaces/SplashScreenGenerator.js';
import { SplashScreenOptions, ProcessedSplashScreen, SplashScreenSize } from '../types/index.js';
/**
 * Implementation of SplashScreenGenerator for generating Android app splash screens
 */
export declare class SplashScreenGenerator implements ISplashScreenGenerator {
    private readonly ANDROID_SPLASH_SIZES;
    /**
     * Process a single splash screen and generate all required Android sizes
     */
    processSplashScreen(options: SplashScreenOptions): Promise<ProcessedSplashScreen[]>;
    /**
     * Validate if the input splash screen file is valid
     */
    validateSplashScreen(splashPath: string): Promise<boolean>;
    /**
     * Get all required Android splash screen sizes
     */
    getRequiredSizes(): SplashScreenSize[];
    /**
     * Generate splash screen for specific dimensions and orientation
     */
    generateSplashScreen(inputPath: string, outputPath: string, width: number, height: number, backgroundColor?: string, scaleMode?: 'contain' | 'cover' | 'fill', imageScale?: number, centerImage?: boolean): Promise<void>;
    /**
     * Get splash screen metadata information
     */
    getSplashScreenMetadata(splashPath: string): Promise<{
        width: number;
        height: number;
        format: string;
    }>;
}
//# sourceMappingURL=SplashScreenGenerator.d.ts.map