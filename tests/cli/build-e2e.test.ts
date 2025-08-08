/**
 * 端到端构建流程测试
 */

import { jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { CLIImpl } from '../../src/cli/CLIImpl.js';
import { CLIErrorHandler } from '../../src/cli/ErrorHandler.js';
import { ConfigManager } from '../../src/config/ConfigManager.js';
import { APKBuilderImpl } from '../../src/apk/APKBuilder.js';
import type { BuildOptions } from '../../src/interfaces/CLI.js';
import type { AppConfig } from '../../src/types/index.js';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('ora');
jest.mock('../../src/config/ConfigManager.js');
jest.mock('../../src/apk/APKBuilder.js');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('Build E2E Tests', () => {
  let cli: CLIImpl;
  let mockConfigManager: jest.Mocked<ConfigManager>;
  let mockAPKBuilder: jest.Mocked<APKBuilderImpl>;
  let testProjectPath: string;
  let testConfigPath: string;

  beforeEach(() => {
    testProjectPath = '/test/project';
    testConfigPath = path.join(testProjectPath, 'web-to-apk.config.json');
    
    jest.clearAllMocks();
    
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

    // Create mock instances
    mockConfigManager = {
      loadConfig: jest.fn(),
      validateConfig: jest.fn()
    } as any;

    mockAPKBuilder = {
      initializeProject: jest.fn(),
      buildAPK: jest.fn(),
      signAPK: jest.fn()
    } as any;

    // Mock constructors
    (ConfigManager as jest.MockedClass<typeof ConfigManager>).mockImplementation(() => mockConfigManager);
    (APKBuilderImpl as jest.MockedClass<typeof APKBuilderImpl>).mockImplementation(() => mockAPKBuilder);

    // Mock fs operations
    mockFs.access.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ size: 1024 * 1024 * 5 } as any); // 5MB
    mockFs.rm.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Create CLI with mocked dependencies
    const errorHandler = new CLIErrorHandler();
    cli = new CLIImpl(mockConfigManager, mockAPKBuilder, errorHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Debug Build Flow', () => {
    it('应该成功执行完整的调试构建流程', async () => {
      // Setup test data
      const testConfig: AppConfig = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: ['android.permission.INTERNET']
      };

      const buildOptions: BuildOptions = {
        output: './build',
        release: false,
        minify: false,
        clean: true
      };

      // Mock successful responses
      mockConfigManager.loadConfig.mockResolvedValue(testConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/app-debug.apk');

      // Execute build
      await cli.build(testConfigPath, buildOptions);

      // Verify the build flow
      expect(mockConfigManager.loadConfig).toHaveBeenCalledWith(testConfigPath);
      expect(mockConfigManager.validateConfig).toHaveBeenCalledWith(testConfig);
      expect(mockAPKBuilder.initializeProject).toHaveBeenCalledWith(testConfig, expect.any(String));
      expect(mockAPKBuilder.buildAPK).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        release: false,
        outputDir: './build',
        minifyWeb: false,
        clean: true
      }));
      
      // Should not sign debug builds
      expect(mockAPKBuilder.signAPK).not.toHaveBeenCalled();
    });

    it('应该处理构建过程中的资源处理', async () => {
      const testConfig: AppConfig = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        icon: './assets/icon.png',
        splashScreen: './assets/splash.png',
        permissions: ['android.permission.INTERNET']
      };

      const buildOptions: BuildOptions = {
        output: './build',
        release: false
      };

      mockConfigManager.loadConfig.mockResolvedValue(testConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/app-debug.apk');

      await cli.build(testConfigPath, buildOptions);

      // Verify resource processing was called
      expect(mockAPKBuilder.initializeProject).toHaveBeenCalledWith(testConfig, expect.any(String));
    });

    it('应该在清理模式下清理输出目录', async () => {
      const testConfig: AppConfig = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: ['android.permission.INTERNET']
      };

      const buildOptions: BuildOptions = {
        output: './build',
        clean: true
      };

      mockConfigManager.loadConfig.mockResolvedValue(testConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/app-debug.apk');

      await cli.build(testConfigPath, buildOptions);

      // Verify cleanup was performed
      expect(mockFs.rm).toHaveBeenCalledWith('./build', { recursive: true, force: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith('./build', { recursive: true });
    });
  });

  describe('Release Build Flow', () => {
    it('应该成功执行完整的发布构建流程', async () => {
      const testConfig: AppConfig = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: ['android.permission.INTERNET']
      };

      const buildOptions: BuildOptions = {
        output: './build',
        release: true,
        keystore: './test.keystore',
        keystorePassword: 'password',
        keyAlias: 'alias',
        keyPassword: 'keypass',
        minify: true
      };

      mockConfigManager.loadConfig.mockResolvedValue(testConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/app-release.apk');
      mockAPKBuilder.signAPK.mockResolvedValue('/test/output/app-release-signed.apk');

      await cli.build(testConfigPath, buildOptions);

      // Verify release build flow
      expect(mockAPKBuilder.buildAPK).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        release: true,
        minifyWeb: true
      }));
      
      // Verify signing was performed
      expect(mockAPKBuilder.signAPK).toHaveBeenCalledWith('/test/output/app-release.apk', {
        path: './test.keystore',
        password: 'password',
        alias: 'alias',
        aliasPassword: 'keypass'
      });
    });

    it('应该在没有密钥库时跳过签名', async () => {
      const testConfig: AppConfig = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: ['android.permission.INTERNET']
      };

      const buildOptions: BuildOptions = {
        output: './build',
        release: true
        // No keystore provided
      };

      mockConfigManager.loadConfig.mockResolvedValue(testConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/app-release.apk');

      await cli.build(testConfigPath, buildOptions);

      // Should not sign without keystore
      expect(mockAPKBuilder.signAPK).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('应该处理配置加载错误', async () => {
      const buildOptions: BuildOptions = {
        output: './build'
      };

      mockConfigManager.loadConfig.mockRejectedValue(new Error('Config load failed'));

      await expect(cli.build(testConfigPath, buildOptions)).rejects.toThrow('Config load failed');
    });

    it('应该处理配置验证错误', async () => {
      const testConfig: AppConfig = {
        appName: 'Test App',
        packageName: 'invalid-package',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: []
      };

      const buildOptions: BuildOptions = {
        output: './build'
      };

      mockConfigManager.loadConfig.mockResolvedValue(testConfig);
      mockConfigManager.validateConfig.mockReturnValue({ 
        isValid: false, 
        errors: [{ field: 'packageName', message: 'Validation failed', severity: 'error' }], 
        warnings: [] 
      });

      await expect(cli.build(testConfigPath, buildOptions)).rejects.toThrow('配置文件验证失败');
    });

    it('应该处理项目初始化错误', async () => {
      const testConfig: AppConfig = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: ['android.permission.INTERNET']
      };

      const buildOptions: BuildOptions = {
        output: './build'
      };

      mockConfigManager.loadConfig.mockResolvedValue(testConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockRejectedValue(new Error('Project init failed'));

      await expect(cli.build(testConfigPath, buildOptions)).rejects.toThrow('Project init failed');
    });

    it('应该处理APK构建错误', async () => {
      const testConfig: AppConfig = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: ['android.permission.INTERNET']
      };

      const buildOptions: BuildOptions = {
        output: './build'
      };

      mockConfigManager.loadConfig.mockResolvedValue(testConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockRejectedValue(new Error('APK build failed'));

      await expect(cli.build(testConfigPath, buildOptions)).rejects.toThrow('APK build failed');
    });

    it('应该处理APK签名错误', async () => {
      const testConfig: AppConfig = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: ['android.permission.INTERNET']
      };

      const buildOptions: BuildOptions = {
        output: './build',
        release: true,
        keystore: './test.keystore',
        keystorePassword: 'password',
        keyAlias: 'alias',
        keyPassword: 'keypass'
      };

      mockConfigManager.loadConfig.mockResolvedValue(testConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/app-release.apk');
      mockAPKBuilder.signAPK.mockRejectedValue(new Error('Signing failed'));

      await expect(cli.build(testConfigPath, buildOptions)).rejects.toThrow('Signing failed');
    });
  });

  describe('Build Performance', () => {
    it('应该在合理时间内完成构建', async () => {
      const testConfig: AppConfig = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: ['android.permission.INTERNET']
      };

      const buildOptions: BuildOptions = {
        output: './build'
      };

      mockConfigManager.loadConfig.mockResolvedValue(testConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/app-debug.apk');

      const startTime = Date.now();
      await cli.build(testConfigPath, buildOptions);
      const endTime = Date.now();

      // Build should complete within reasonable time (mocked, so should be very fast)
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });

    it('应该正确显示构建统计信息', async () => {
      const testConfig: AppConfig = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: ['android.permission.INTERNET']
      };

      const buildOptions: BuildOptions = {
        output: './build'
      };

      mockConfigManager.loadConfig.mockResolvedValue(testConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/app-debug.apk');

      await cli.build(testConfigPath, buildOptions);

      // Verify that build info was displayed
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('构建信息'));
    });
  });
});