import { SplashScreenGenerator } from '../../src/resources/SplashScreenGenerator.js';
import { WebToAPKError } from '../../src/types/index.js';
import { promises as fs } from 'node:fs';
import sharp from 'sharp';

// Mock sharp
jest.mock('sharp');
const mockSharp = sharp as jest.MockedFunction<typeof sharp>;

// Mock fs
jest.mock('node:fs', () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
  }
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('SplashScreenGenerator', () => {
  let splashGenerator: SplashScreenGenerator;
  const mockOutputDir = '/test/output';
  const mockInputPath = '/test/input/splash.png';

  beforeEach(() => {
    splashGenerator = new SplashScreenGenerator();
    jest.clearAllMocks();
  });

  describe('validateSplashScreen', () => {
    it('should return true for valid splash screen', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      const mockMetadata = {
        width: 1080,
        height: 1920,
        format: 'png'
      };
      
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockMetadata)
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);

      const result = await splashGenerator.validateSplashScreen(mockInputPath);
      
      expect(result).toBe(true);
      expect(mockFs.access).toHaveBeenCalledWith(mockInputPath);
      expect(mockSharp).toHaveBeenCalledWith(mockInputPath);
    });

    it('should return false for non-existent file', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const result = await splashGenerator.validateSplashScreen(mockInputPath);
      
      expect(result).toBe(false);
    });

    it('should return false for invalid image format', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      const mockMetadata = {
        width: 1080,
        height: 1920,
        format: 'bmp' // unsupported format
      };
      
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockMetadata)
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);

      const result = await splashGenerator.validateSplashScreen(mockInputPath);
      
      expect(result).toBe(false);
    });

    it('should return false for image without dimensions', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      const mockMetadata = {
        width: undefined,
        height: undefined,
        format: 'png'
      };
      
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockMetadata)
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);

      const result = await splashGenerator.validateSplashScreen(mockInputPath);
      
      expect(result).toBe(false);
    });

    it('should warn for small splash screens', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockFs.access.mockResolvedValue(undefined);
      
      const mockMetadata = {
        width: 320,
        height: 480,
        format: 'png'
      };
      
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockMetadata)
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);

      const result = await splashGenerator.validateSplashScreen(mockInputPath);
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('smaller than recommended size')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('getRequiredSizes', () => {
    it('should return essential splash screen sizes only', () => {
      const sizes = splashGenerator.getRequiredSizes();
      
      expect(sizes.length).toBeGreaterThan(0);
      expect(sizes.every(size => 
        ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi'].includes(size.density)
      )).toBe(true);
      
      // Should include both portrait and landscape orientations
      const hasPortrait = sizes.some(size => size.orientation === 'portrait');
      const hasLandscape = sizes.some(size => size.orientation === 'landscape');
      expect(hasPortrait).toBe(true);
      expect(hasLandscape).toBe(true);
    });
  });

  describe('generateSplashScreen', () => {
    beforeEach(() => {
      const mockInputMetadata = {
        width: 512,
        height: 512
      };
      
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockInputMetadata),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized-image')),
        composite: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toFile: jest.fn().mockResolvedValue(undefined)
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);
      
      // Mock sharp constructor for background creation
      (mockSharp as any).mockImplementation((input?: any) => {
        if (input && input.create) {
          return {
            composite: jest.fn().mockReturnThis(),
            png: jest.fn().mockReturnThis(),
            toFile: jest.fn().mockResolvedValue(undefined)
          };
        }
        return mockSharpInstance;
      });
    });

    it('should generate splash screen successfully', async () => {
      await splashGenerator.generateSplashScreen(
        mockInputPath, 
        '/output/splash.png', 
        480, 
        800
      );
      
      expect(mockSharp).toHaveBeenCalledWith(mockInputPath);
      expect(mockSharp).toHaveBeenCalledWith({
        create: {
          width: 480,
          height: 800,
          channels: 4,
          background: '#ffffff'
        }
      });
    });

    it('should generate splash screen with custom background color', async () => {
      await splashGenerator.generateSplashScreen(
        mockInputPath, 
        '/output/splash.png', 
        480, 
        800,
        '#000000'
      );
      
      expect(mockSharp).toHaveBeenCalledWith({
        create: {
          width: 480,
          height: 800,
          channels: 4,
          background: '#000000'
        }
      });
    });

    it('should generate splash screen with cover scale mode', async () => {
      await splashGenerator.generateSplashScreen(
        mockInputPath, 
        '/output/splash.png', 
        480, 
        800,
        '#ffffff',
        'cover',
        0.8,
        true
      );
      
      expect(mockSharp).toHaveBeenCalledWith(mockInputPath);
    });

    it('should generate splash screen with fill scale mode', async () => {
      await splashGenerator.generateSplashScreen(
        mockInputPath, 
        '/output/splash.png', 
        480, 
        800,
        '#ffffff',
        'fill'
      );
      
      expect(mockSharp).toHaveBeenCalledWith(mockInputPath);
    });

    it('should throw WebToAPKError on generation failure', async () => {
      const mockSharpInstance = {
        metadata: jest.fn().mockRejectedValue(new Error('Metadata failed'))
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);

      await expect(
        splashGenerator.generateSplashScreen(mockInputPath, '/output/splash.png', 480, 800)
      ).rejects.toThrow(WebToAPKError);
    });
  });

  describe('processSplashScreen', () => {
    beforeEach(() => {
      // Mock validateSplashScreen to return true
      jest.spyOn(splashGenerator, 'validateSplashScreen').mockResolvedValue(true);
      jest.spyOn(splashGenerator, 'generateSplashScreen').mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
    });

    it('should process splash screen and generate all sizes by default', async () => {
      const options = {
        inputPath: mockInputPath,
        outputDir: mockOutputDir
      };

      const results = await splashGenerator.processSplashScreen(options);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(result => result.success)).toBe(true);
      expect(mockFs.mkdir).toHaveBeenCalled();
      
      // Should generate both portrait and landscape splash screens
      const hasPortrait = results.some(result => result.size.orientation === 'portrait');
      const hasLandscape = results.some(result => result.size.orientation === 'landscape');
      expect(hasPortrait).toBe(true);
      expect(hasLandscape).toBe(true);
    });

    it('should process splash screen with generateAllSizes=false', async () => {
      const options = {
        inputPath: mockInputPath,
        outputDir: mockOutputDir,
        generateAllSizes: false
      };

      const results = await splashGenerator.processSplashScreen(options);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(result => result.success)).toBe(true);
      // Should use getRequiredSizes() which returns fewer sizes
      const allSizes = new SplashScreenGenerator()['ANDROID_SPLASH_SIZES'];
      expect(results.length).toBeLessThan(allSizes.length);
    });

    it('should process splash screen with custom background color', async () => {
      const options = {
        inputPath: mockInputPath,
        outputDir: mockOutputDir,
        backgroundColor: '#ff0000'
      };

      const results = await splashGenerator.processSplashScreen(options);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(result => result.success)).toBe(true);
    });

    it('should process splash screen with custom scale mode and options', async () => {
      const options = {
        inputPath: mockInputPath,
        outputDir: mockOutputDir,
        scaleMode: 'cover' as const,
        imageScale: 0.8,
        centerImage: false
      };

      const results = await splashGenerator.processSplashScreen(options);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(result => result.success)).toBe(true);
    });

    it('should process splash screen with fill scale mode', async () => {
      const options = {
        inputPath: mockInputPath,
        outputDir: mockOutputDir,
        scaleMode: 'fill' as const
      };

      const results = await splashGenerator.processSplashScreen(options);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(result => result.success)).toBe(true);
    });

    it('should throw error for invalid splash screen', async () => {
      jest.spyOn(splashGenerator, 'validateSplashScreen').mockResolvedValue(false);
      
      const options = {
        inputPath: mockInputPath,
        outputDir: mockOutputDir
      };

      await expect(splashGenerator.processSplashScreen(options)).rejects.toThrow(WebToAPKError);
    });

    it('should handle generation errors gracefully', async () => {
      jest.spyOn(splashGenerator, 'generateSplashScreen').mockRejectedValue(new Error('Generation failed'));
      
      const options = {
        inputPath: mockInputPath,
        outputDir: mockOutputDir
      };

      const results = await splashGenerator.processSplashScreen(options);
      
      expect(results.some(result => !result.success)).toBe(true);
      expect(results.some(result => result.error)).toBe(true);
    });
  });

  describe('getSplashScreenMetadata', () => {
    it('should return splash screen metadata', async () => {
      const mockMetadata = {
        width: 1080,
        height: 1920,
        format: 'png'
      };
      
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockMetadata)
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);

      const result = await splashGenerator.getSplashScreenMetadata(mockInputPath);
      
      expect(result).toEqual({
        width: 1080,
        height: 1920,
        format: 'png'
      });
    });

    it('should throw WebToAPKError on metadata read failure', async () => {
      const mockSharpInstance = {
        metadata: jest.fn().mockRejectedValue(new Error('Metadata read failed'))
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);

      await expect(
        splashGenerator.getSplashScreenMetadata(mockInputPath)
      ).rejects.toThrow(WebToAPKError);
    });

    it('should handle missing metadata fields', async () => {
      const mockMetadata = {
        width: undefined,
        height: undefined,
        format: undefined
      };
      
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockMetadata)
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);

      const result = await splashGenerator.getSplashScreenMetadata(mockInputPath);
      
      expect(result).toEqual({
        width: 0,
        height: 0,
        format: 'unknown'
      });
    });
  });
});