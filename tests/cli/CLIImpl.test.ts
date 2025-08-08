/**
 * CLI实现类单元测试
 */

import { jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { CLIImpl } from '../../src/cli/CLIImpl.js';
import type { InitOptions, BuildOptions, ServeOptions } from '../../src/interfaces/CLI.js';
import type { ConfigManager } from '../../src/interfaces/ConfigManager.js';
import type { APKBuilder } from '../../src/interfaces/APKBuilder.js';
import type { ErrorHandler } from '../../src/interfaces/ErrorHandler.js';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('inquirer');
jest.mock('ora');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('CLIImpl', () => {
  let cli: CLIImpl;
  let mockConfigManager: jest.Mocked<ConfigManager>;
  let mockAPKBuilder: jest.Mocked<APKBuilder>;
  let mockErrorHandler: jest.Mocked<ErrorHandler>;

  // Helper function to create a complete AppConfig
  const createMockConfig = (overrides: Partial<any> = {}): any => ({
    appName: 'Test App',
    packageName: 'com.test.app',
    version: '1.0.0',
    webDir: './dist',
    startUrl: 'index.html',
    permissions: ['android.permission.INTERNET'],
    ...overrides
  });

  beforeEach(() => {
    // Create mock instances
    mockConfigManager = {
      loadConfig: jest.fn(),
      validateConfig: jest.fn(),
      generateCapacitorConfig: jest.fn()
    } as jest.Mocked<ConfigManager>;

    mockAPKBuilder = {
      initializeProject: jest.fn(),
      buildAPK: jest.fn(),
      signAPK: jest.fn()
    } as jest.Mocked<APKBuilder>;

    mockErrorHandler = {
      handleConfigError: jest.fn(),
      handleBuildError: jest.fn(),
      provideSolution: jest.fn()
    } as jest.Mocked<ErrorHandler>;

    // Create CLI instance with mocked dependencies
    cli = new CLIImpl(mockConfigManager, mockAPKBuilder, mockErrorHandler);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    
    // Mock ora spinner
    const mockSpinner = {
      start: jest.fn().mockReturnThis(),
      stop: jest.fn().mockReturnThis(),
      succeed: jest.fn().mockReturnThis(),
      fail: jest.fn().mockReturnThis(),
      text: ''
    };
    
    const ora = require('ora');
    ora.mockReturnValue(mockSpinner);
  });

  describe('init', () => {
    it('应该创建项目目录和配置文件', async () => {
      const projectPath = './test-project';
      const options: InitOptions = {
        name: 'Test App',
        packageName: 'com.test.app',
        interactive: false
      };

      await cli.init(projectPath, options);

      expect(mockFs.mkdir).toHaveBeenCalledWith(projectPath, { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(projectPath, 'web-to-apk.config.json'),
        expect.stringContaining('"appName": "Test App"'),
        'utf8'
      );
    });

    it('应该创建项目结构文件', async () => {
      const projectPath = './test-project';
      const options: InitOptions = { interactive: false };

      await cli.init(projectPath, options);

      // 验证创建了必要的目录
      expect(mockFs.mkdir).toHaveBeenCalledWith(path.join(projectPath, 'src'), { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith(path.join(projectPath, 'dist'), { recursive: true });

      // 验证创建了示例文件
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(projectPath, 'dist', 'index.html'),
        expect.stringContaining('<!DOCTYPE html>'),
        'utf-8'
      );
    });
  });

  describe('build', () => {
    it('应该成功构建APK', async () => {
      const configPath = './web-to-apk.config.json';
      const options: BuildOptions = { output: './dist' };
      const mockConfig = createMockConfig();
      const mockAPKPath = './dist/app-debug.apk';

      mockConfigManager.loadConfig.mockResolvedValue(mockConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.buildAPK.mockResolvedValue(mockAPKPath);

      await cli.build(configPath, options);

      expect(mockConfigManager.loadConfig).toHaveBeenCalledWith(configPath);
      expect(mockConfigManager.validateConfig).toHaveBeenCalledWith(mockConfig);
      expect(mockAPKBuilder.initializeProject).toHaveBeenCalledWith(mockConfig, path.dirname(configPath));
      expect(mockAPKBuilder.buildAPK).toHaveBeenCalledWith(path.dirname(configPath), expect.objectContaining({
        release: false,
        outputDir: './dist',
        minifyWeb: false
      }));
    });

    it('应该在发布模式下签名APK', async () => {
      const configPath = './web-to-apk.config.json';
      const options: BuildOptions = {
        release: true,
        keystore: './my-key.keystore',
        keystorePassword: 'password',
        keyAlias: 'mykey',
        keyPassword: 'keypass'
      };
      const mockConfig = createMockConfig();
      const mockAPKPath = './dist/app-release.apk';

      mockConfigManager.loadConfig.mockResolvedValue(mockConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.buildAPK.mockResolvedValue(mockAPKPath);

      await cli.build(configPath, options);

      expect(mockAPKBuilder.signAPK).toHaveBeenCalledWith(mockAPKPath, {
        path: './my-key.keystore',
        password: 'password',
        alias: 'mykey',
        aliasPassword: 'keypass'
      });
    });

    it('应该处理配置验证失败', async () => {
      const configPath = './web-to-apk.config.json';
      const options: BuildOptions = {};
      const mockConfig = createMockConfig();

      mockConfigManager.loadConfig.mockResolvedValue(mockConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: false, errors: [], warnings: [] });

      await expect(cli.build(configPath, options)).rejects.toThrow('配置文件验证失败');
    });

    it('应该处理构建错误', async () => {
      const configPath = './web-to-apk.config.json';
      const options: BuildOptions = {};
      const mockConfig = createMockConfig();

      mockConfigManager.loadConfig.mockResolvedValue(mockConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.buildAPK.mockRejectedValue(new Error('Build failed'));

      await expect(cli.build(configPath, options)).rejects.toThrow('Build failed');
    });
  });

  describe('serve', () => {
    it('应该启动开发服务器', async () => {
      const options: ServeOptions = {
        port: 3000,
        host: 'localhost',
        open: false
      };

      // Mock the serve method to avoid actually starting a server
      const serveSpy = jest.spyOn(cli, 'serve').mockResolvedValue(undefined);

      await cli.serve(options);

      expect(serveSpy).toHaveBeenCalledWith(options);
      
      serveSpy.mockRestore();
    }, 1000);

    it('应该处理端口冲突', async () => {
      const options: ServeOptions = {
        port: 3000,
        host: 'localhost',
        open: false
      };

      // Mock the serve method to simulate port conflict
      const serveSpy = jest.spyOn(cli, 'serve').mockRejectedValue(new Error('Port already in use'));

      await expect(cli.serve(options)).rejects.toThrow('Port already in use');
      
      serveSpy.mockRestore();
    }, 1000);
  });
});