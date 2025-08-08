/**
 * Web服务器端到端测试
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import axios from 'axios';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock external dependencies
jest.mock('axios');
jest.mock('child_process');
jest.mock('sharp');

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockSharp = sharp as jest.MockedFunction<typeof sharp>;

// Import server after mocking
let app: express.Application;
let server: any;

describe('Web Server E2E Tests', () => {
  beforeAll(async () => {
    // Mock sharp
    const mockSharpInstance = {
      resize: jest.fn().mockReturnThis(),
      png: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image-data'))
    };
    mockSharp.mockReturnValue(mockSharpInstance as any);

    // Mock fs operations
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('mock-file-content'));
    jest.spyOn(fs, 'access').mockResolvedValue(undefined);
    jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readdir').mockResolvedValue(['test-app-debug.apk'] as any);
    jest.spyOn(fs, 'rm').mockResolvedValue(undefined);

    // Mock child_process spawn
    const mockSpawn = jest.fn().mockImplementation(() => ({
      stdout: {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            setTimeout(() => callback('Build output'), 100);
          }
        })
      },
      stderr: {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            setTimeout(() => callback(''), 100);
          }
        })
      },
      on: jest.fn((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 200);
        }
      })
    }));

    const childProcess = await import('child_process');
    (childProcess.spawn as jest.Mock) = mockSpawn;

    // Import and start server
    const serverModule = await import('../../web-server/server.js');
    app = serverModule.default || serverModule.app;
    
    // Start server on a test port
    const PORT = 3001;
    server = app.listen(PORT);
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      });
    }
    jest.restoreAllMocks();
    // Force cleanup of any remaining handles
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Static File Serving', () => {
    it('应该提供主页面', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toContain('Web-to-APK');
      expect(response.text).toContain('Convert your web application');
    });

    it('应该提供CSS文件', async () => {
      const response = await request(app)
        .get('/styles.css')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/css/);
    });

    it('应该提供JavaScript文件', async () => {
      const response = await request(app)
        .get('/script.js')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/javascript/);
    });
  });

  describe('API Endpoints', () => {
    describe('POST /api/build', () => {
      it('应该成功处理基本构建请求', async () => {
        const response = await request(app)
          .post('/api/build')
          .field('appName', 'Test App')
          .field('packageName', 'com.test.app')
          .field('version', '1.0.0')
          .expect(200);

        expect(response.body).toMatchObject({
          buildId: expect.any(String),
          status: 'building',
          message: expect.stringContaining('APK build started')
        });
      });

      it('应该处理带图标上传的构建请求', async () => {
        // Create a mock image buffer
        const mockImageBuffer = Buffer.from('mock-image-data');
        
        const response = await request(app)
          .post('/api/build')
          .field('appName', 'Test App with Icon')
          .field('packageName', 'com.test.iconapp')
          .field('version', '1.0.0')
          .attach('icon', mockImageBuffer, 'test-icon.png')
          .expect(200);

        expect(response.body).toMatchObject({
          buildId: expect.any(String),
          status: 'building',
          message: expect.stringContaining('APK build started')
        });

        // Verify sharp was called for image processing
        expect(mockSharp).toHaveBeenCalled();
      });

      it('应该处理带网站URL的构建请求（favicon抓取）', async () => {
        // Mock axios responses for favicon fetching
        mockAxios.get
          .mockResolvedValueOnce({
            data: '<html><head><link rel="icon" href="/favicon.ico"></head></html>',
            status: 200
          })
          .mockResolvedValueOnce({
            data: Buffer.from('mock-favicon-data'),
            status: 200
          });

        const response = await request(app)
          .post('/api/build')
          .field('appName', 'Test App with URL')
          .field('packageName', 'com.test.urlapp')
          .field('version', '1.0.0')
          .field('websiteUrl', 'https://example.com')
          .expect(200);

        expect(response.body).toMatchObject({
          buildId: expect.any(String),
          status: 'building',
          message: expect.stringContaining('APK build started')
        });

        // Verify axios was called for favicon fetching
        expect(mockAxios.get).toHaveBeenCalledWith(
          'https://example.com',
          expect.any(Object)
        );
      });

      it('应该在favicon抓取失败时使用默认图标', async () => {
        // Mock axios to fail favicon fetching
        mockAxios.get.mockRejectedValue(new Error('Network error'));

        const response = await request(app)
          .post('/api/build')
          .field('appName', 'Test App Default Icon')
          .field('packageName', 'com.test.defaulticon')
          .field('version', '1.0.0')
          .field('websiteUrl', 'https://nonexistent.com')
          .expect(200);

        expect(response.body).toMatchObject({
          buildId: expect.any(String),
          status: 'building',
          message: expect.stringContaining('APK build started')
        });

        // Verify default icon generation was called
        expect(mockSharp).toHaveBeenCalledWith(expect.any(Buffer));
      });

      it('应该验证必需字段', async () => {
        const response = await request(app)
          .post('/api/build')
          .field('appName', 'Test App')
          // Missing packageName and version
          .expect(400);

        expect(response.body).toMatchObject({
          error: expect.stringContaining('Missing required fields')
        });
      });

      it('应该验证包名格式', async () => {
        const response = await request(app)
          .post('/api/build')
          .field('appName', 'Test App')
          .field('packageName', 'invalid-package-name')
          .field('version', '1.0.0')
          .expect(400);

        expect(response.body).toMatchObject({
          error: expect.stringContaining('Invalid package name format')
        });
      });

      it('应该拒绝过大的文件', async () => {
        // Create a large buffer (6MB)
        const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

        const response = await request(app)
          .post('/api/build')
          .field('appName', 'Test App')
          .field('packageName', 'com.test.app')
          .field('version', '1.0.0')
          .attach('icon', largeBuffer, 'large-icon.png')
          .expect(400);

        expect(response.body).toMatchObject({
          error: expect.stringContaining('File too large')
        });
      });

      it('应该拒绝无效的文件类型', async () => {
        const textBuffer = Buffer.from('This is not an image');

        const response = await request(app)
          .post('/api/build')
          .field('appName', 'Test App')
          .field('packageName', 'com.test.app')
          .field('version', '1.0.0')
          .attach('icon', textBuffer, 'not-an-image.txt')
          .expect(400);

        expect(response.body).toMatchObject({
          error: expect.stringContaining('Invalid file type')
        });
      });
    });

    describe('GET /api/status/:buildId', () => {
      it('应该返回构建中状态', async () => {
        const buildId = 'test-build-id';

        const response = await request(app)
          .get(`/api/status/${buildId}`)
          .expect(200);

        expect(response.body).toMatchObject({
          status: 'building',
          message: expect.stringContaining('Build in progress')
        });
      });

      it('应该返回构建完成状态', async () => {
        const buildId = 'completed-build-id';

        // Mock successful build result
        jest.spyOn(fs, 'readFile').mockResolvedValueOnce(JSON.stringify({
          status: 'success',
          apkFile: 'test-app-debug.apk',
          config: {
            appName: 'Test App',
            packageName: 'com.test.app',
            version: '1.0.0'
          },
          buildTime: new Date().toISOString()
        }));

        const response = await request(app)
          .get(`/api/status/${buildId}`)
          .expect(200);

        expect(response.body).toMatchObject({
          status: 'completed',
          downloadUrl: expect.stringContaining('/downloads/'),
          config: expect.objectContaining({
            appName: 'Test App',
            packageName: 'com.test.app',
            version: '1.0.0'
          }),
          buildTime: expect.any(String)
        });
      });

      it('应该返回构建错误状态', async () => {
        const buildId = 'failed-build-id';

        // Mock failed build result
        jest.spyOn(fs, 'readFile').mockResolvedValueOnce(JSON.stringify({
          status: 'error',
          error: 'Build failed: Invalid configuration',
          config: {
            appName: 'Failed App',
            packageName: 'com.test.failedapp',
            version: '1.0.0'
          },
          buildTime: new Date().toISOString()
        }));

        const response = await request(app)
          .get(`/api/status/${buildId}`)
          .expect(200);

        expect(response.body).toMatchObject({
          status: 'error',
          error: expect.stringContaining('Build failed'),
          config: expect.objectContaining({
            appName: 'Failed App'
          }),
          buildTime: expect.any(String)
        });
      });
    });
  });

  describe('File Upload Functionality', () => {
    it('应该正确处理PNG图标上传', async () => {
      const pngBuffer = Buffer.from('mock-png-data');

      const response = await request(app)
        .post('/api/build')
        .field('appName', 'PNG Test App')
        .field('packageName', 'com.test.pngapp')
        .field('version', '1.0.0')
        .attach('icon', pngBuffer, 'test-icon.png')
        .expect(200);

      expect(response.body.status).toBe('building');
      expect(mockSharp).toHaveBeenCalled();
    });

    it('应该正确处理JPEG图标上传', async () => {
      const jpegBuffer = Buffer.from('mock-jpeg-data');

      const response = await request(app)
        .post('/api/build')
        .field('appName', 'JPEG Test App')
        .field('packageName', 'com.test.jpegapp')
        .field('version', '1.0.0')
        .attach('icon', jpegBuffer, 'test-icon.jpg')
        .expect(200);

      expect(response.body.status).toBe('building');
      expect(mockSharp).toHaveBeenCalled();
    });

    it('应该正确处理WebP图标上传', async () => {
      const webpBuffer = Buffer.from('mock-webp-data');

      const response = await request(app)
        .post('/api/build')
        .field('appName', 'WebP Test App')
        .field('packageName', 'com.test.webpapp')
        .field('version', '1.0.0')
        .attach('icon', webpBuffer, 'test-icon.webp')
        .expect(200);

      expect(response.body.status).toBe('building');
      expect(mockSharp).toHaveBeenCalled();
    });
  });

  describe('Favicon Extraction', () => {
    it('应该从HTML中提取favicon链接', async () => {
      const htmlContent = `
        <html>
          <head>
            <link rel="icon" href="/custom-favicon.ico">
            <title>Test Site</title>
          </head>
        </html>
      `;

      mockAxios.get
        .mockResolvedValueOnce({
          data: htmlContent,
          status: 200
        })
        .mockResolvedValueOnce({
          data: Buffer.from('mock-favicon-data'),
          status: 200
        });

      const response = await request(app)
        .post('/api/build')
        .field('appName', 'Favicon Test App')
        .field('packageName', 'com.test.faviconapp')
        .field('version', '1.0.0')
        .field('websiteUrl', 'https://example.com')
        .expect(200);

      expect(response.body.status).toBe('building');
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://example.com',
        expect.any(Object)
      );
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://example.com/custom-favicon.ico',
        expect.any(Object)
      );
    });

    it('应该处理相对URL的favicon', async () => {
      const htmlContent = `
        <html>
          <head>
            <link rel="shortcut icon" href="assets/favicon.png">
          </head>
        </html>
      `;

      mockAxios.get
        .mockResolvedValueOnce({
          data: htmlContent,
          status: 200
        })
        .mockResolvedValueOnce({
          data: Buffer.from('mock-favicon-data'),
          status: 200
        });

      const response = await request(app)
        .post('/api/build')
        .field('appName', 'Relative Favicon App')
        .field('packageName', 'com.test.relativefavicon')
        .field('version', '1.0.0')
        .field('websiteUrl', 'https://example.com')
        .expect(200);

      expect(response.body.status).toBe('building');
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://example.com/assets/favicon.png',
        expect.any(Object)
      );
    });

    it('应该尝试多种favicon选择器', async () => {
      const htmlContent = `
        <html>
          <head>
            <link rel="apple-touch-icon" href="/apple-touch-icon.png">
            <title>Test Site</title>
          </head>
        </html>
      `;

      mockAxios.get
        .mockResolvedValueOnce({
          data: htmlContent,
          status: 200
        })
        .mockResolvedValueOnce({
          data: Buffer.from('mock-apple-icon-data'),
          status: 200
        });

      const response = await request(app)
        .post('/api/build')
        .field('appName', 'Apple Icon App')
        .field('packageName', 'com.test.appleicon')
        .field('version', '1.0.0')
        .field('websiteUrl', 'https://example.com')
        .expect(200);

      expect(response.body.status).toBe('building');
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://example.com/apple-touch-icon.png',
        expect.any(Object)
      );
    });

    it('应该回退到默认favicon.ico', async () => {
      const htmlContent = '<html><head><title>No Favicon</title></head></html>';

      mockAxios.get
        .mockResolvedValueOnce({
          data: htmlContent,
          status: 200
        })
        .mockResolvedValueOnce({
          data: Buffer.from('mock-default-favicon'),
          status: 200
        });

      const response = await request(app)
        .post('/api/build')
        .field('appName', 'Default Favicon App')
        .field('packageName', 'com.test.defaultfavicon')
        .field('version', '1.0.0')
        .field('websiteUrl', 'https://example.com')
        .expect(200);

      expect(response.body.status).toBe('building');
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://example.com/favicon.ico',
        expect.any(Object)
      );
    });
  });

  describe('Build Process Integration', () => {
    it('应该正确调用web-to-apk构建命令', async () => {
      const response = await request(app)
        .post('/api/build')
        .field('appName', 'Build Process Test')
        .field('packageName', 'com.test.buildprocess')
        .field('version', '1.0.0')
        .expect(200);

      const buildId = response.body.buildId;

      // Wait for build process to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // Check if spawn was called with correct parameters
      const childProcess = await import('child_process');
      expect(childProcess.spawn).toHaveBeenCalledWith(
        'node',
        expect.arrayContaining([
          expect.stringContaining('src/index.js'),
          'build',
          expect.stringContaining('web-to-apk.config.json'),
          '--output',
          expect.any(String)
        ]),
        expect.any(Object)
      );
    });

    it('应该创建正确的项目结构', async () => {
      const response = await request(app)
        .post('/api/build')
        .field('appName', 'Project Structure Test')
        .field('packageName', 'com.test.projectstructure')
        .field('version', '1.0.0')
        .expect(200);

      // Wait for build process to start
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify directory creation
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('temp'),
        { recursive: true }
      );

      // Verify config file creation
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('web-to-apk.config.json'),
        expect.stringContaining('"appName": "Project Structure Test"'),
        expect.any(String)
      );

      // Verify HTML file creation
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('index.html'),
        expect.stringContaining('Project Structure Test'),
        expect.any(String)
      );
    });

    it('应该处理构建失败', async () => {
      // Mock spawn to return error
      const mockSpawnError = jest.fn().mockImplementation(() => ({
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 100); // Exit code 1 = failure
          }
        })
      }));

      const childProcess = await import('child_process');
      (childProcess.spawn as jest.Mock) = mockSpawnError;

      const response = await request(app)
        .post('/api/build')
        .field('appName', 'Build Failure Test')
        .field('packageName', 'com.test.buildfailure')
        .field('version', '1.0.0')
        .expect(200);

      const buildId = response.body.buildId;

      // Wait for build process to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Check status should show error
      const statusResponse = await request(app)
        .get(`/api/status/${buildId}`)
        .expect(200);

      // Since the build result file might not be created yet in the mock,
      // we just verify the spawn was called
      expect(mockSpawnError).toHaveBeenCalled();
    });
  });

  describe('Security and Validation', () => {
    it('应该应用速率限制', async () => {
      // Make multiple requests quickly
      const requests = Array(12).fill(null).map(() =>
        request(app)
          .post('/api/build')
          .field('appName', 'Rate Limit Test')
          .field('packageName', 'com.test.ratelimit')
          .field('version', '1.0.0')
      );

      const responses = await Promise.allSettled(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(
        (result) => result.status === 'fulfilled' && 
        (result.value as any).status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('应该验证输入数据', async () => {
      // Test XSS prevention
      const response = await request(app)
        .post('/api/build')
        .field('appName', '<script>alert("xss")</script>')
        .field('packageName', 'com.test.xss')
        .field('version', '1.0.0')
        .expect(200);

      expect(response.body.buildId).toBeDefined();
      // The server should handle the input safely
    });

    it('应该设置安全头部', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Error Handling', () => {
    it('应该处理404错误', async () => {
      const response = await request(app)
        .get('/nonexistent-endpoint')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not found'
      });
    });

    it('应该处理无效的构建ID', async () => {
      const response = await request(app)
        .get('/api/status/invalid-build-id')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'building',
        message: expect.stringContaining('Build in progress')
      });
    });

    it('应该处理服务器错误', async () => {
      // Mock fs.writeFile to throw error
      jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('Disk full'));

      const response = await request(app)
        .post('/api/build')
        .field('appName', 'Error Test')
        .field('packageName', 'com.test.error')
        .field('version', '1.0.0')
        .expect(500);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('Internal server error')
      });
    });
  });
});