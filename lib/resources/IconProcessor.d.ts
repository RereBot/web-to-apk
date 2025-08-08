import { IconProcessor as IIconProcessor } from '../interfaces/IconProcessor.js';
import { IconProcessorOptions, ProcessedIcon, IconSize } from '../types/index.js';
/**
 * Implementation of IconProcessor for generating Android app icons
 */
export declare class IconProcessor implements IIconProcessor {
    private readonly ANDROID_ICON_SIZES;
    private readonly SUPPORTED_FORMATS;
    /**
     * Get supported image formats
     */
    getSupportedFormats(): string[];
    /**
     * Process a single icon and generate all required Android sizes
     */
    processIcon(options: IconProcessorOptions): Promise<ProcessedIcon[]>;
    /**
     * Validate if the input icon file is valid
     */
    validateIcon(iconPath: string): Promise<boolean>;
    /**
     * Get all required Android icon sizes
     */
    getRequiredSizes(): IconSize[];
    /**
     * Resize an icon to specific dimensions
     */
    resizeIcon(inputPath: string, outputPath: string, width: number, height: number): Promise<void>;
    /**
     * Get icon metadata information
     */
    getIconMetadata(iconPath: string): Promise<{
        width: number;
        height: number;
        format: string;
    }>;
}
//# sourceMappingURL=IconProcessor.d.ts.map