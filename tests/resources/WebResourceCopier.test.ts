import { WebResourceCopier } from '../../src/resources/WebResourceCopier.js';
import { WebToAPKError } from '../../src/types/index.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

// Mock fs
jest.mock('node:fs', () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    copyFile: jest.fn(),
    stat: jest.fn(),
    readdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  }
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('WebResourceCopier', () => {
  let copier: WebResourceCopier;
  const mockSourceDir = '/test/source';
  const mockTargetDir = '/test/target';

  beforeEach(() => {
    copier = new WebResourceCopier();
    jest.clearAllMocks();
  });

  describe('copyWebResources', () => {
    beforeEach(() => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.copyFile.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);
    });

    it('should copy web resources successfully', async () => {
      const mockFiles = [
        join(mockSourceDir, 'index.html'),
        join(mockSourceDir, 'style.css'),
        join(mockSourceDir, 'script.js')
      ];

      jest.spyOn(copier, 'getWebResourceFiles').mockResolvedValue(mockFiles);

      const result = await copier.copyWebResources(mockSourceDir, mockTargetDir);

      expect(result.success).toBe(true);
      expect(result.copiedFiles).toHaveLength(3);
      expect(result.copiedFiles).toContain('index.html');
      expect(result.copiedFiles).toContain('style.css');
      expect(result.copiedFiles).toContain('script.js');
      expect(result.totalFiles).toBe(3);
      expect(result.totalSize).toBe(3072); // 3 files * 1024 bytes each
      expect(result.errors).toHaveLength(0);
    });

    it('should handle copy errors gracefully', async () => {
      const mockFiles = [
        join(mockSourceDir, 'index.html'),
        join(mockSourceDir, 'error.css')
      ];

      jest.spyOn(copier, 'getWebResourceFiles').mockResolvedValue(mockFiles);
      
      mockFs.copyFile.mockImplementation((src) => {
        if (src.toString().includes('error.css')) {
          return Promise.reject(new Error('Copy failed'));
        }
        return Promise.resolve(undefined);
      });

      const result = await copier.copyWebResources(mockSourceDir, mockTargetDir);

      expect(result.success).toBe(false);
      expect(result.copiedFiles).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].file).toBe('error.css');
      expect(result.errors[0].error).toBe('Copy failed');
    });

    it('should handle source directory access error', async () => {
      mockFs.access.mockRejectedValue(new Error('Directory not found'));

      const result = await copier.copyWebResources(mockSourceDir, mockTargetDir);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].file).toBe(mockSourceDir);
      expect(result.errors[0].error).toBe('Directory not found');
    });
  });

  describe('validateWebResources', () => {
    it('should validate valid web resources', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      const mockFiles = [
        join(mockSourceDir, 'index.html'),
        join(mockSourceDir, 'style.css'),
        join(mockSourceDir, 'script.js')
      ];

      jest.spyOn(copier, 'getWebResourceFiles').mockResolvedValue(mockFiles);
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);

      const result = await copier.validateWebResources(mockSourceDir);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing index.html', async () => {
      mockFs.access.mockImplementation((path) => {
        if (path.toString().endsWith('index.html')) {
          return Promise.reject(new Error('File not found'));
        }
        return Promise.resolve(undefined);
      });

      jest.spyOn(copier, 'getWebResourceFiles').mockResolvedValue([
        join(mockSourceDir, 'style.css')
      ]);

      const result = await copier.validateWebResources(mockSourceDir);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('index.html');
      expect(result.errors[0].message).toContain('No index.html file found');
    });

    it('should detect empty directory', async () => {
      mockFs.access.mockImplementation((path) => {
        if (path.toString().endsWith('index.html')) {
          return Promise.reject(new Error('File not found'));
        }
        return Promise.resolve(undefined);
      });
      jest.spyOn(copier, 'getWebResourceFiles').mockResolvedValue([]);

      const result = await copier.validateWebResources(mockSourceDir);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2); // Missing index.html + no files
      expect(result.errors.some(e => e.message.includes('No web resource files found'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('No index.html file found'))).toBe(true);
    });

    it('should warn about unsupported file types', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      const mockFiles = [
        join(mockSourceDir, 'index.html'),
        join(mockSourceDir, 'document.pdf') // Unsupported
      ];

      jest.spyOn(copier, 'getWebResourceFiles').mockResolvedValue(mockFiles);
      mockFs.stat.mockResolvedValue({ size: 1024 } as any);

      const result = await copier.validateWebResources(mockSourceDir);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('may not be supported');
    });

    it('should warn about large files', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      const mockFiles = [join(mockSourceDir, 'index.html')];
      jest.spyOn(copier, 'getWebResourceFiles').mockResolvedValue(mockFiles);
      
      mockFs.stat.mockResolvedValue({ size: 15 * 1024 * 1024 } as any); // 15MB

      const result = await copier.validateWebResources(mockSourceDir);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('Large file detected');
    });
  });

  describe('getWebResourceFiles', () => {
    it('should scan directory and return web resource files', async () => {
      const mockEntries = [
        { name: 'index.html', isDirectory: () => false, isFile: () => true },
        { name: 'style.css', isDirectory: () => false, isFile: () => true },
        { name: 'script.js', isDirectory: () => false, isFile: () => true },
        { name: 'image.png', isDirectory: () => false, isFile: () => true },
        { name: 'document.pdf', isDirectory: () => false, isFile: () => true }, // Should be excluded
        { name: 'assets', isDirectory: () => true, isFile: () => false }
      ];

      mockFs.readdir.mockResolvedValue(mockEntries as any);

      // Mock subdirectory scan
      mockFs.readdir.mockImplementation((dir) => {
        if (dir.toString().endsWith('assets')) {
          return Promise.resolve([
            { name: 'logo.svg', isDirectory: () => false, isFile: () => true }
          ] as any);
        }
        return Promise.resolve(mockEntries as any);
      });

      const files = await copier.getWebResourceFiles(mockSourceDir);

      expect(files).toHaveLength(5); // 4 from root + 1 from assets, excluding PDF
      expect(files).toContain(join(mockSourceDir, 'index.html'));
      expect(files).toContain(join(mockSourceDir, 'style.css'));
      expect(files).toContain(join(mockSourceDir, 'script.js'));
      expect(files).toContain(join(mockSourceDir, 'image.png'));
      expect(files).toContain(join(mockSourceDir, 'assets', 'logo.svg'));
    });

    it('should skip excluded directories', async () => {
      const mockEntries = [
        { name: 'index.html', isDirectory: () => false, isFile: () => true },
        { name: 'node_modules', isDirectory: () => true, isFile: () => false },
        { name: '.git', isDirectory: () => true, isFile: () => false }
      ];

      mockFs.readdir.mockResolvedValue(mockEntries as any);

      const files = await copier.getWebResourceFiles(mockSourceDir);

      expect(files).toHaveLength(1);
      expect(files).toContain(join(mockSourceDir, 'index.html'));
    });

    it('should throw WebToAPKError on scan failure', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      await expect(copier.getWebResourceFiles(mockSourceDir)).rejects.toThrow(WebToAPKError);
    });
  });

  describe('transformResourcePaths', () => {
    const mockHtmlContent = `
      <html>
        <head>
          <link rel="stylesheet" href="./style.css">
          <script src="/js/script.js"></script>
        </head>
        <body>
          <img src="../images/logo.png" alt="Logo">
        </body>
      </html>
    `;

    const mockCssContent = `
      .background {
        background-image: url('./images/bg.jpg');
      }
      .icon {
        background: url("/icons/star.svg");
      }
    `;

    it('should transform HTML paths', async () => {
      mockFs.readFile.mockResolvedValue(mockHtmlContent);
      mockFs.writeFile.mockResolvedValue(undefined);

      await copier.transformResourcePaths('/test/index.html', {
        baseUrl: 'assets',
        assetPrefix: 'app'
      });

      expect(mockFs.writeFile).toHaveBeenCalled();
      const transformedContent = (mockFs.writeFile as jest.Mock).mock.calls[0][1];
      
      expect(transformedContent).toContain('href="app/assets/style.css"');
      expect(transformedContent).toContain('src="app/assets/js/script.js"');
      expect(transformedContent).toContain('src="app/assets/../images/logo.png"');
    });

    it('should transform CSS paths', async () => {
      mockFs.readFile.mockResolvedValue(mockCssContent);
      mockFs.writeFile.mockResolvedValue(undefined);

      await copier.transformResourcePaths('/test/style.css', {
        baseUrl: 'assets'
      });

      expect(mockFs.writeFile).toHaveBeenCalled();
      const transformedContent = (mockFs.writeFile as jest.Mock).mock.calls[0][1];
      
      expect(transformedContent).toContain('url("assets/images/bg.jpg")');
      expect(transformedContent).toContain('url("assets/icons/star.svg")');
    });

    it('should skip non-transformable files', async () => {
      await copier.transformResourcePaths('/test/image.png');

      expect(mockFs.readFile).not.toHaveBeenCalled();
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should preserve external URLs', async () => {
      const contentWithExternalUrls = `
        <link rel="stylesheet" href="https://cdn.example.com/style.css">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==">
        <script src="//ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
      `;

      mockFs.readFile.mockResolvedValue(contentWithExternalUrls);
      mockFs.writeFile.mockResolvedValue(undefined);

      await copier.transformResourcePaths('/test/index.html');

      const transformedContent = (mockFs.writeFile as jest.Mock).mock.calls[0][1];
      
      expect(transformedContent).toContain('https://cdn.example.com/style.css');
      expect(transformedContent).toContain('data:image/png;base64,');
      expect(transformedContent).toContain('//ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js');
    });

    it('should throw WebToAPKError on file read failure', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(
        copier.transformResourcePaths('/test/index.html')
      ).rejects.toThrow(WebToAPKError);
    });

    it('should throw WebToAPKError on file write failure', async () => {
      mockFs.readFile.mockResolvedValue(mockHtmlContent);
      mockFs.writeFile.mockRejectedValue(new Error('Write failed'));

      await expect(
        copier.transformResourcePaths('/test/index.html')
      ).rejects.toThrow(WebToAPKError);
    });
  });
});