import { ResourceProcessor } from '../interfaces/ResourceProcessor.js';
import { IconProcessor } from './IconProcessor.js';
import { SplashScreenGenerator } from './SplashScreenGenerator.js';
import { WebResourceCopier } from './WebResourceCopier.js';
import { WebToAPKError } from '../types/index.js';
import { getLogger } from '../logging/Logger.js';

/**
 * Implementation of ResourceProcessor that coordinates all resource processing tasks
 */
export class ResourceProcessorImpl implements ResourceProcessor {
  private iconProcessor: IconProcessor;
  private splashScreenGenerator: SplashScreenGenerator;
  private webResourceCopier: WebResourceCopier;
  private logger = getLogger();

  constructor() {
    this.iconProcessor = new IconProcessor();
    this.splashScreenGenerator = new SplashScreenGenerator();
    this.webResourceCopier = new WebResourceCopier();
  }

  /**
   * Process and generate icon files for different resolutions
   */
  async processIcon(iconPath: string, outputDir: string): Promise<void> {
    try {
      const results = await this.iconProcessor.processIcon({
        inputPath: iconPath,
        outputDir,
        generateAllSizes: true
      });

      const failedResults = results.filter(result => !result.success);
      if (failedResults.length > 0) {
        const errors = failedResults.map(result => result.error).join(', ');
        throw new WebToAPKError('RESOURCE', `Failed to process some icon sizes: ${errors}`, {
          iconPath,
          outputDir,
          failedResults
        });
      }

      this.logger.info(
        `Successfully processed icon: ${results.length} sizes generated`,
        'RESOURCE',
        {
          iconPath,
          outputDir,
          sizesGenerated: results.length
        }
      );
    } catch (error) {
      if (error instanceof WebToAPKError) {
        throw error;
      }
      throw new WebToAPKError(
        'RESOURCE',
        `Failed to process icon: ${error instanceof Error ? error.message : String(error)}`,
        { iconPath, outputDir }
      );
    }
  }

  /**
   * Generate splash screen resources for different screen densities
   */
  async generateSplashScreens(splashPath: string, outputDir: string): Promise<void> {
    try {
      const results = await this.splashScreenGenerator.processSplashScreen({
        inputPath: splashPath,
        outputDir,
        generateAllSizes: true,
        backgroundColor: '#ffffff',
        scaleMode: 'contain',
        imageScale: 0.6,
        centerImage: true
      });

      const failedResults = results.filter(result => !result.success);
      if (failedResults.length > 0) {
        const errors = failedResults.map(result => result.error).join(', ');
        throw new WebToAPKError(
          'RESOURCE',
          `Failed to generate some splash screen sizes: ${errors}`,
          { splashPath, outputDir, failedResults }
        );
      }

      this.logger.info(
        `Successfully generated splash screens: ${results.length} sizes created`,
        'RESOURCE',
        {
          splashPath,
          outputDir,
          sizesCreated: results.length
        }
      );
    } catch (error) {
      if (error instanceof WebToAPKError) {
        throw error;
      }
      throw new WebToAPKError(
        'RESOURCE',
        `Failed to generate splash screens: ${error instanceof Error ? error.message : String(error)}`,
        { splashPath, outputDir }
      );
    }
  }

  /**
   * Copy web assets to the output directory
   */
  async copyWebAssets(webDir: string, outputDir: string): Promise<void> {
    try {
      const result = await this.webResourceCopier.copyWebResources(webDir, outputDir);

      if (!result.success) {
        const errors = result.errors.map(error => error.error).join(', ');
        throw new WebToAPKError('RESOURCE', `Failed to copy some web assets: ${errors}`, {
          webDir,
          outputDir,
          errors: result.errors
        });
      }

      this.logger.info(
        `Successfully copied web assets: ${result.copiedFiles.length} files (${result.totalSize} bytes)`,
        'RESOURCE',
        {
          webDir,
          outputDir,
          copiedFiles: result.copiedFiles.length,
          totalSize: result.totalSize
        }
      );
    } catch (error) {
      if (error instanceof WebToAPKError) {
        throw error;
      }
      throw new WebToAPKError(
        'RESOURCE',
        `Failed to copy web assets: ${error instanceof Error ? error.message : String(error)}`,
        { webDir, outputDir }
      );
    }
  }
}
