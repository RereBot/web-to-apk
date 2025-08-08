import { ResourceProcessorImpl } from '../../src/resources/ResourceProcessor.js';
import { WebToAPKError } from '../../src/types/index.js';
import * as Logger from '../../src/logging/Logger.js';

describe('ResourceProcessorImpl', () => {
  let resourceProcessor: ResourceProcessorImpl;
  let mockIconProcessorProcessIcon: jest.SpyInstance;
  let mockSplashScreenGeneratorProcessSplashScreen: jest.SpyInstance;
  let mockWebResourceCopierCopyWebResources: jest.SpyInstance;
  let mockLogger: any;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock logger before creating ResourceProcessor
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn(),
      cleanup: jest.fn(),
      flush: jest.fn()
    };
    loggerSpy = jest.spyOn(Logger, 'getLogger').mockReturnValue(mockLogger as any);

    resourceProcessor = new ResourceProcessorImpl();
    
    // Spy on the methods we need
    mockIconProcessorProcessIcon = jest.spyOn(resourceProcessor['iconProcessor'], 'processIcon');
    mockSplashScreenGeneratorProcessSplashScreen = jest.spyOn(resourceProcessor['splashScreenGenerator'], 'processSplashScreen');
    mockWebResourceCopierCopyWebResources = jest.spyOn(resourceProcessor['webResourceCopier'], 'copyWebResources');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    loggerSpy.mockRestore();
  });

  describe('processIcon', () => {
    it('should successfully process icon', async () => {
      const mockResults = [
        { size: { width: 48, height: 48, density: 'mdpi', folder: 'drawable-mdpi' }, outputPath: '/output/icon.png', success: true },
        { size: { width: 72, height: 72, density: 'hdpi', folder: 'drawable-hdpi' }, outputPath: '/output/icon.png', success: true }
      ];

      mockIconProcessorProcessIcon.mockResolvedValue(mockResults);

      await resourceProcessor.processIcon('/input/icon.png', '/output');

      expect(mockIconProcessorProcessIcon).toHaveBeenCalledWith({
        inputPath: '/input/icon.png',
        outputDir: '/output',
        generateAllSizes: true
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully processed icon: 2 sizes generated',
        'RESOURCE',
        {
          iconPath: '/input/icon.png',
          outputDir: '/output',
          sizesGenerated: 2
        }
      );
    });

    it('should throw WebToAPKError when some icon processing fails', async () => {
      const mockResults = [
        { size: { width: 48, height: 48, density: 'mdpi', folder: 'drawable-mdpi' }, outputPath: '/output/icon.png', success: true },
        { size: { width: 72, height: 72, density: 'hdpi', folder: 'drawable-hdpi' }, outputPath: '', success: false, error: 'Processing failed' }
      ];

      mockIconProcessorProcessIcon.mockResolvedValue(mockResults);

      await expect(resourceProcessor.processIcon('/input/icon.png', '/output'))
        .rejects.toThrow(WebToAPKError);
    });

    it('should handle icon processor errors', async () => {
      mockIconProcessorProcessIcon.mockRejectedValue(new Error('Icon processor failed'));

      await expect(resourceProcessor.processIcon('/input/icon.png', '/output'))
        .rejects.toThrow(WebToAPKError);
    });

    it('should handle WebToAPKError from icon processor', async () => {
      const webToAPKError = new WebToAPKError('RESOURCE', 'Icon validation failed', {});
      mockIconProcessorProcessIcon.mockRejectedValue(webToAPKError);

      await expect(resourceProcessor.processIcon('/input/icon.png', '/output'))
        .rejects.toThrow(webToAPKError);
    });
  });

  describe('generateSplashScreens', () => {
    it('should successfully generate splash screens', async () => {
      const mockResults = [
        { 
          size: { width: 480, height: 800, density: 'mdpi', folder: 'drawable-mdpi', orientation: 'portrait' as const }, 
          outputPath: '/output/splash.png', 
          success: true 
        },
        { 
          size: { width: 800, height: 480, density: 'mdpi', folder: 'drawable-mdpi', orientation: 'landscape' as const }, 
          outputPath: '/output/splash.png', 
          success: true 
        }
      ];

      mockSplashScreenGeneratorProcessSplashScreen.mockResolvedValue(mockResults);

      await resourceProcessor.generateSplashScreens('/input/splash.png', '/output');

      expect(mockSplashScreenGeneratorProcessSplashScreen).toHaveBeenCalledWith({
        inputPath: '/input/splash.png',
        outputDir: '/output',
        generateAllSizes: true,
        backgroundColor: '#ffffff',
        scaleMode: 'contain',
        imageScale: 0.6,
        centerImage: true
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully generated splash screens: 2 sizes created',
        'RESOURCE',
        {
          splashPath: '/input/splash.png',
          outputDir: '/output',
          sizesCreated: 2
        }
      );
    });

    it('should throw WebToAPKError when some splash screen generation fails', async () => {
      const mockResults = [
        { 
          size: { width: 480, height: 800, density: 'mdpi', folder: 'drawable-mdpi', orientation: 'portrait' as const }, 
          outputPath: '/output/splash.png', 
          success: true 
        },
        { 
          size: { width: 800, height: 480, density: 'mdpi', folder: 'drawable-mdpi', orientation: 'landscape' as const }, 
          outputPath: '', 
          success: false, 
          error: 'Generation failed' 
        }
      ];

      mockSplashScreenGeneratorProcessSplashScreen.mockResolvedValue(mockResults);

      await expect(resourceProcessor.generateSplashScreens('/input/splash.png', '/output'))
        .rejects.toThrow(WebToAPKError);
    });

    it('should handle splash screen generator errors', async () => {
      mockSplashScreenGeneratorProcessSplashScreen.mockRejectedValue(new Error('Splash generator failed'));

      await expect(resourceProcessor.generateSplashScreens('/input/splash.png', '/output'))
        .rejects.toThrow(WebToAPKError);
    });

    it('should handle WebToAPKError from splash screen generator', async () => {
      const webToAPKError = new WebToAPKError('RESOURCE', 'Splash screen validation failed', {});
      mockSplashScreenGeneratorProcessSplashScreen.mockRejectedValue(webToAPKError);

      await expect(resourceProcessor.generateSplashScreens('/input/splash.png', '/output'))
        .rejects.toThrow(webToAPKError);
    });
  });

  describe('copyWebAssets', () => {
    it('should successfully copy web assets', async () => {
      const mockResult = {
        success: true,
        copiedFiles: ['index.html', 'style.css', 'script.js'],
        errors: [],
        totalFiles: 3,
        totalSize: 1024
      };

      mockWebResourceCopierCopyWebResources.mockResolvedValue(mockResult);

      await resourceProcessor.copyWebAssets('/input/web', '/output');

      expect(mockWebResourceCopierCopyWebResources).toHaveBeenCalledWith('/input/web', '/output');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully copied web assets: 3 files (1024 bytes)',
        'RESOURCE',
        {
          webDir: '/input/web',
          outputDir: '/output',
          copiedFiles: 3,
          totalSize: 1024
        }
      );
    });

    it('should throw WebToAPKError when web asset copying fails', async () => {
      const mockResult = {
        success: false,
        copiedFiles: ['index.html'],
        errors: [
          { file: 'style.css', error: 'File not found' },
          { file: 'script.js', error: 'Permission denied' }
        ],
        totalFiles: 3,
        totalSize: 512
      };

      mockWebResourceCopierCopyWebResources.mockResolvedValue(mockResult);

      await expect(resourceProcessor.copyWebAssets('/input/web', '/output'))
        .rejects.toThrow(WebToAPKError);
    });

    it('should handle web resource copier errors', async () => {
      mockWebResourceCopierCopyWebResources.mockRejectedValue(new Error('Web copier failed'));

      await expect(resourceProcessor.copyWebAssets('/input/web', '/output'))
        .rejects.toThrow(WebToAPKError);
    });

    it('should handle WebToAPKError from web resource copier', async () => {
      const webToAPKError = new WebToAPKError('RESOURCE', 'Web resource validation failed', {});
      mockWebResourceCopierCopyWebResources.mockRejectedValue(webToAPKError);

      await expect(resourceProcessor.copyWebAssets('/input/web', '/output'))
        .rejects.toThrow(webToAPKError);
    });
  });
});