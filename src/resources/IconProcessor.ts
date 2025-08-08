import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { IconProcessor as IIconProcessor } from '../interfaces/IconProcessor.js';
import { IconProcessorOptions, ProcessedIcon, IconSize, WebToAPKError } from '../types/index.js';

/**
 * Implementation of IconProcessor for generating Android app icons
 */
export class IconProcessor implements IIconProcessor {
  private readonly ANDROID_ICON_SIZES: IconSize[] = [
    { width: 36, height: 36, density: 'ldpi', folder: 'drawable-ldpi' },
    { width: 48, height: 48, density: 'mdpi', folder: 'drawable-mdpi' },
    { width: 72, height: 72, density: 'hdpi', folder: 'drawable-hdpi' },
    { width: 96, height: 96, density: 'xhdpi', folder: 'drawable-xhdpi' },
    { width: 144, height: 144, density: 'xxhdpi', folder: 'drawable-xxhdpi' },
    { width: 192, height: 192, density: 'xxxhdpi', folder: 'drawable-xxxhdpi' },
    // Launcher icons
    { width: 48, height: 48, density: 'mdpi', folder: 'mipmap-mdpi' },
    { width: 72, height: 72, density: 'hdpi', folder: 'mipmap-hdpi' },
    { width: 96, height: 96, density: 'xhdpi', folder: 'mipmap-xhdpi' },
    { width: 144, height: 144, density: 'xxhdpi', folder: 'mipmap-xxhdpi' },
    { width: 192, height: 192, density: 'xxxhdpi', folder: 'mipmap-xxxhdpi' }
  ];

  private readonly SUPPORTED_FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];

  /**
   * Get supported image formats
   */
  getSupportedFormats(): string[] {
    return [...this.SUPPORTED_FORMATS];
  }

  /**
   * Process a single icon and generate all required Android sizes
   */
  async processIcon(options: IconProcessorOptions): Promise<ProcessedIcon[]> {
    const { inputPath, outputDir, generateAllSizes = true } = options;

    // Validate input icon
    const isValid = await this.validateIcon(inputPath);
    if (!isValid) {
      throw new WebToAPKError('RESOURCE', `Invalid icon file: ${inputPath}`, { inputPath });
    }

    const results: ProcessedIcon[] = [];
    const sizesToGenerate = generateAllSizes ? this.ANDROID_ICON_SIZES : this.getRequiredSizes();

    for (const size of sizesToGenerate) {
      try {
        const outputFolder = join(outputDir, size.folder);
        await fs.mkdir(outputFolder, { recursive: true });

        const outputPath = join(outputFolder, 'ic_launcher.png');

        await this.resizeIcon(inputPath, outputPath, size.width, size.height);

        results.push({
          size,
          outputPath,
          success: true
        });
      } catch (error) {
        results.push({
          size,
          outputPath: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Validate if the input icon file is valid
   */
  async validateIcon(iconPath: string): Promise<boolean> {
    try {
      // Check if file exists
      await fs.access(iconPath);

      // Check if it's a valid image using sharp
      const metadata = await sharp(iconPath).metadata();

      // Validate image properties
      if (!metadata.width || !metadata.height) {
        return false;
      }

      // Check minimum size (should be at least 192x192 for best quality)
      if (metadata.width < 192 || metadata.height < 192) {
        console.warn(
          `Warning: Icon ${iconPath} is smaller than recommended size (192x192). Current size: ${metadata.width}x${metadata.height}`
        );
      }

      // Check if it's square
      if (metadata.width !== metadata.height) {
        console.warn(`Warning: Icon ${iconPath} is not square. This may cause distortion.`);
      }

      // Check supported formats
      const supportedFormats = ['png', 'jpeg', 'jpg', 'webp', 'svg'];
      if (!supportedFormats.includes(metadata.format || '')) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all required Android icon sizes
   */
  getRequiredSizes(): IconSize[] {
    // Return essential sizes only (not all densities)
    return this.ANDROID_ICON_SIZES.filter(
      size =>
        ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'].includes(size.density) &&
        size.folder.startsWith('mipmap')
    );
  }

  /**
   * Resize an icon to specific dimensions
   */
  async resizeIcon(
    inputPath: string,
    outputPath: string,
    width: number,
    height: number
  ): Promise<void> {
    try {
      await sharp(inputPath)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .png({
          quality: 90,
          compressionLevel: 6
        })
        .toFile(outputPath);
    } catch (error) {
      throw new WebToAPKError(
        'RESOURCE',
        `Failed to resize icon: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { inputPath, outputPath, width, height }
      );
    }
  }

  /**
   * Get icon metadata information
   */
  async getIconMetadata(
    iconPath: string
  ): Promise<{ width: number; height: number; format: string }> {
    try {
      const metadata = await sharp(iconPath).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown'
      };
    } catch (error) {
      throw new WebToAPKError(
        'RESOURCE',
        `Failed to read icon metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { iconPath }
      );
    }
  }
}
