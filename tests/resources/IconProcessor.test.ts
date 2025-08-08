import { IconProcessor } from '../../src/resources/IconProcessor.js';
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

describe('IconProcessor', () => {
  let iconProcessor: IconProcessor;
  const mockOutputDir = '/test/output';
  const mockInputPath = '/test/input/icon.png';

  beforeEach(() => {
    iconProcessor = new IconProcessor();
    jest.clearAllMocks();
  });

  describe('validateIcon', () => {
    it('should return true for valid icon', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      const mockMetadata = {
        width: 512,
        height: 512,
        format: 'png'
      };
      
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockMetadata)
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);

      const result = await iconProcessor.validateIcon(mockInputPath);
      
      expect(result).toBe(true);
      expect(mockFs.access).toHaveBeenCalledWith(mockInputPath);
      expect(mockSharp).toHaveBeenCalledWith(mockInputPath);
    });

    it('should return false for non-existent file', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const result = await iconProcessor.validateIcon(mockInputPath);
      
      expect(result).toBe(false);
    });

    it('should return false for invalid image format', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      const mockMetadata = {
        width: 512,
        height: 512,
        format: 'bmp' // unsupported format
      };
      
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockMetadata)
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);

      const result = await iconProcessor.validateIcon(mockInputPath);
      
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

      const result = await iconProcessor.validateIcon(mockInputPath);
      
      expect(result).toBe(false);
    });

    it('should warn for small icons', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockFs.access.mockResolvedValue(undefined);
      
      const mockMetadata = {
        width: 100,
        height: 100,
        format: 'png'
      };
      
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockMetadata)
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);

      const result = await iconProcessor.validateIcon(mockInputPath);
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('smaller than recommended size')
      );
      
      consoleSpy.mockRestore();
    });

    it('should warn for non-square icons', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockFs.access.mockResolvedValue(undefined);
      
      const mockMetadata = {
        width: 512,
        height: 256,
        format: 'png'
      };
      
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockMetadata)
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);

      const result = await iconProcessor.validateIcon(mockInputPath);
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('not square')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('getRequiredSizes', () => {
    it('should return essential mipmap sizes only', () => {
      const sizes = iconProcessor.getRequiredSizes();
      
      expect(sizes.length).toBeGreaterThan(0);
      expect(sizes.every(size => size.folder.startsWith('mipmap'))).toBe(true);
      expect(sizes.every(size => 
        ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'].includes(size.density)
      )).toBe(true);
    });
  });

  describe('resizeIcon', () => {
    it('should resize icon successfully', async () => {
      const mockSharpInstance = {
        resize: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toFile: jest.fn().mockResolvedValue(undefined)
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);

      await iconProcessor.resizeIcon(mockInputPath, '/output/icon.png', 48, 48);
      
      expect(mockSharp).toHaveBeenCalledWith(mockInputPath);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(48, 48, {
        fit: 'cover',
        position: 'center'
      });
      expect(mockSharpInstance.png).toHaveBeenCalledWith({
        quality: 90,
        compressionLevel: 6
      });
      expect(mockSharpInstance.toFile).toHaveBeenCalledWith('/output/icon.png');
    });

    it('should throw WebToAPKError on resize failure', async () => {
      const mockSharpInstance = {
        resize: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toFile: jest.fn().mockRejectedValue(new Error('Resize failed'))
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);

      await expect(
        iconProcessor.resizeIcon(mockInputPath, '/output/icon.png', 48, 48)
      ).rejects.toThrow(WebToAPKError);
    });
  });

  describe('processIcon', () => {
    beforeEach(() => {
      // Mock validateIcon to return true
      jest.spyOn(iconProcessor, 'validateIcon').mockResolvedValue(true);
      jest.spyOn(iconProcessor, 'resizeIcon').mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
    });

    it('should process icon and generate all sizes by default', async () => {
      const options = {
        inputPath: mockInputPath,
        outputDir: mockOutputDir
      };

      const results = await iconProcessor.processIcon(options);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(result => result.success)).toBe(true);
      expect(mockFs.mkdir).toHaveBeenCalled();
    });

    it('should process icon with generateAllSizes=false', async () => {
      const options = {
        inputPath: mockInputPath,
        outputDir: mockOutputDir,
        generateAllSizes: false
      };

      const results = await iconProcessor.processIcon(options);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(result => result.success)).toBe(true);
      // Should use getRequiredSizes() which returns fewer sizes
      const allSizes = new IconProcessor()['ANDROID_ICON_SIZES'];
      expect(results.length).toBeLessThan(allSizes.length);
    });

    it('should throw error for invalid icon', async () => {
      jest.spyOn(iconProcessor, 'validateIcon').mockResolvedValue(false);
      
      const options = {
        inputPath: mockInputPath,
        outputDir: mockOutputDir
      };

      await expect(iconProcessor.processIcon(options)).rejects.toThrow(WebToAPKError);
    });

    it('should handle resize errors gracefully', async () => {
      jest.spyOn(iconProcessor, 'resizeIcon').mockRejectedValue(new Error('Resize failed'));
      
      const options = {
        inputPath: mockInputPath,
        outputDir: mockOutputDir
      };

      const results = await iconProcessor.processIcon(options);
      
      expect(results.some(result => !result.success)).toBe(true);
      expect(results.some(result => result.error)).toBe(true);
    });
  });

  describe('getIconMetadata', () => {
    it('should return icon metadata', async () => {
      const mockMetadata = {
        width: 512,
        height: 512,
        format: 'png'
      };
      
      const mockSharpInstance = {
        metadata: jest.fn().mockResolvedValue(mockMetadata)
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);

      const result = await iconProcessor.getIconMetadata(mockInputPath);
      
      expect(result).toEqual({
        width: 512,
        height: 512,
        format: 'png'
      });
    });

    it('should throw WebToAPKError on metadata read failure', async () => {
      const mockSharpInstance = {
        metadata: jest.fn().mockRejectedValue(new Error('Metadata read failed'))
      };
      
      mockSharp.mockReturnValue(mockSharpInstance as any);

      await expect(
        iconProcessor.getIconMetadata(mockInputPath)
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

      const result = await iconProcessor.getIconMetadata(mockInputPath);
      
      expect(result).toEqual({
        width: 0,
        height: 0,
        format: 'unknown'
      });
    });
  });
});