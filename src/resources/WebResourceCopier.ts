import { promises as fs } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { WebResourceCopier as IWebResourceCopier } from '../interfaces/WebResourceCopier.js';
import {
  CopyResult,
  CopyError,
  PathTransformOptions,
  ValidationResult,
  WebToAPKError
} from '../types/index.js';

/**
 * Implementation of WebResourceCopier for copying and organizing web resources
 */
export class WebResourceCopier implements IWebResourceCopier {
  private readonly SUPPORTED_EXTENSIONS = [
    '.html',
    '.htm',
    '.css',
    '.js',
    '.json',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.webp',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.mp3',
    '.mp4',
    '.webm',
    '.ogg',
    '.txt',
    '.xml',
    '.ico'
  ];

  private readonly TRANSFORMABLE_EXTENSIONS = ['.html', '.htm', '.css', '.js'];

  /**
   * Copy web resources from source directory to target directory
   */
  async copyWebResources(sourceDir: string, targetDir: string): Promise<CopyResult> {
    const result: CopyResult = {
      success: true,
      copiedFiles: [],
      errors: [],
      totalFiles: 0,
      totalSize: 0
    };

    try {
      // Validate source directory exists
      await fs.access(sourceDir);

      // Create target directory if it doesn't exist
      await fs.mkdir(targetDir, { recursive: true });

      // Get all web resource files
      const files = await this.getWebResourceFiles(sourceDir);
      result.totalFiles = files.length;

      for (const file of files) {
        try {
          const relativePath = relative(sourceDir, file);
          const targetPath = join(targetDir, relativePath);

          // Create target directory structure
          await fs.mkdir(dirname(targetPath), { recursive: true });

          // Copy file
          await fs.copyFile(file, targetPath);

          // Get file size
          const stats = await fs.stat(file);
          result.totalSize += stats.size;

          result.copiedFiles.push(relativePath);
        } catch (error) {
          const copyError: CopyError = {
            file: relative(sourceDir, file),
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          result.errors.push(copyError);
          result.success = false;
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        file: sourceDir,
        error: error instanceof Error ? error.message : 'Failed to access source directory'
      });
    }

    return result;
  }

  /**
   * Validate web resource directory structure and files
   */
  async validateWebResources(webDir: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Check if directory exists
      await fs.access(webDir);

      // Check if directory contains an index.html file
      const indexPath = join(webDir, 'index.html');
      try {
        await fs.access(indexPath);
      } catch {
        result.errors.push({
          field: 'index.html',
          message: 'No index.html file found in web directory',
          severity: 'error'
        });
        result.isValid = false;
      }

      // Get all files and validate them
      const files = await this.getWebResourceFiles(webDir);

      if (files.length === 0) {
        result.errors.push({
          field: 'files',
          message: 'No web resource files found in directory',
          severity: 'error'
        });
        result.isValid = false;
      }

      // Check for unsupported file types
      for (const file of files) {
        const ext = extname(file).toLowerCase();
        if (!this.SUPPORTED_EXTENSIONS.includes(ext)) {
          result.warnings.push({
            field: relative(webDir, file),
            message: `File type ${ext} may not be supported`,
            severity: 'warning'
          });
        }
      }

      // Check for large files (> 10MB)
      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          if (stats.size > 10 * 1024 * 1024) {
            result.warnings.push({
              field: relative(webDir, file),
              message: `Large file detected (${Math.round(stats.size / 1024 / 1024)}MB). Consider optimizing.`,
              severity: 'warning'
            });
          }
        } catch {
          // Ignore stat errors for individual files
        }
      }
    } catch (error) {
      result.errors.push({
        field: 'directory',
        message: error instanceof Error ? error.message : 'Failed to access web directory',
        severity: 'error'
      });
      result.isValid = false;
    }

    return result;
  }

  /**
   * Transform relative paths in HTML/CSS/JS files for mobile app context
   */
  async transformResourcePaths(
    filePath: string,
    transformOptions?: PathTransformOptions
  ): Promise<void> {
    const options: Required<PathTransformOptions> = {
      baseUrl: '',
      assetPrefix: '',
      transformAbsolutePaths: true,
      ...transformOptions
    };

    try {
      const ext = extname(filePath).toLowerCase();

      if (!this.TRANSFORMABLE_EXTENSIONS.includes(ext)) {
        return; // Skip non-transformable files
      }

      let content = await fs.readFile(filePath, 'utf-8');

      switch (ext) {
      case '.html':
      case '.htm':
        content = this.transformHtmlPaths(content, options);
        break;
      case '.css':
        content = this.transformCssPaths(content, options);
        break;
      case '.js':
        content = this.transformJsPaths(content, options);
        break;
      }

      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new WebToAPKError(
        'RESOURCE',
        `Failed to transform paths in ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { filePath, transformOptions }
      );
    }
  }

  /**
   * Get list of all web resource files in directory
   */
  async getWebResourceFiles(webDir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      await this.scanDirectory(webDir, files);
    } catch (error) {
      throw new WebToAPKError(
        'RESOURCE',
        `Failed to scan web directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { webDir }
      );
    }

    return files;
  }

  /**
   * Recursively scan directory for web resource files
   */
  private async scanDirectory(dir: string, files: string[]): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip common non-web directories
        if (!['node_modules', '.git', '.svn', 'dist', 'build'].includes(entry.name)) {
          await this.scanDirectory(fullPath, files);
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (this.SUPPORTED_EXTENSIONS.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  /**
   * Transform paths in HTML content
   */
  private transformHtmlPaths(content: string, options: Required<PathTransformOptions>): string {
    // Transform src attributes
    content = content.replace(/\s(src|href)=["']([^"']+)["']/gi, (match, attr, path) =>
      this.transformPath(match, attr, path, options)
    );

    // Transform CSS url() references in style attributes
    content = content.replace(/style=["'][^"']*url\(([^)]+)\)[^"']*/gi, match =>
      this.transformCssUrlsInMatch(match, options)
    );

    return content;
  }

  /**
   * Transform paths in CSS content
   */
  private transformCssPaths(content: string, options: Required<PathTransformOptions>): string {
    // Transform url() references
    content = content.replace(/url\(["']?([^"')]+)["']?\)/gi, (_match, path) => {
      const transformedPath = this.applyPathTransform(path, options);
      return `url("${transformedPath}")`;
    });

    return content;
  }

  /**
   * Transform paths in JavaScript content
   */
  private transformJsPaths(content: string, options: Required<PathTransformOptions>): string {
    // This is a basic implementation - in practice, you might want to use a proper JS parser
    // Transform common patterns like require() or import statements
    content = content.replace(
      /(require\(["']|import\s+.*?from\s+["']|import\s*\(["'])([^"']+)(["'])/gi,
      (match, prefix, path, suffix) => {
        if (path.startsWith('./') || path.startsWith('../')) {
          const transformedPath = this.applyPathTransform(path, options);
          return `${prefix}${transformedPath}${suffix}`;
        }
        return match;
      }
    );

    return content;
  }

  /**
   * Transform a single path attribute
   */
  private transformPath(
    _match: string,
    attr: string,
    path: string,
    options: Required<PathTransformOptions>
  ): string {
    const transformedPath = this.applyPathTransform(path, options);
    return ` ${attr}="${transformedPath}"`;
  }

  /**
   * Transform CSS urls within a matched string
   */
  private transformCssUrlsInMatch(match: string, options: Required<PathTransformOptions>): string {
    return match.replace(/url\(["']?([^"')]+)["']?\)/gi, (_urlMatch, path) => {
      const transformedPath = this.applyPathTransform(path, options);
      return `url("${transformedPath}")`;
    });
  }

  /**
   * Apply path transformation based on options
   */
  private applyPathTransform(path: string, options: Required<PathTransformOptions>): string {
    // Skip data URLs, external URLs, and already transformed paths
    if (
      path.startsWith('data:') ||
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('//')
    ) {
      return path;
    }

    // Clean up relative path indicators
    if (path.startsWith('./')) {
      path = path.substring(2);
    }

    // Handle absolute paths
    if (path.startsWith('/') && options.transformAbsolutePaths) {
      path = path.substring(1); // Remove leading slash
    }

    // Apply base URL if specified
    if (options.baseUrl) {
      path = options.baseUrl + '/' + path;
    }

    // Apply asset prefix if specified
    if (options.assetPrefix) {
      path = options.assetPrefix + '/' + path;
    }

    // Clean up double slashes and normalize path
    path = path.replace(/\/+/g, '/');

    return path;
  }
}
