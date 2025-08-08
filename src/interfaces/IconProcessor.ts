import { IconProcessorOptions, ProcessedIcon } from '../types/index.js';

/**
 * Interface for icon processing functionality
 */
export interface IconProcessor {
  /**
   * Process an icon file and generate all required sizes for Android
   */
  processIcon(options: IconProcessorOptions): Promise<ProcessedIcon[]>;

  /**
   * Validate if the input file is a valid image
   */
  validateIcon(inputPath: string): Promise<boolean>;

  /**
   * Get supported image formats
   */
  getSupportedFormats(): string[];
}
