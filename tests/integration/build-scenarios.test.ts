/**
 * 多种配置场景的集成测试
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

describe('Build Scenarios Integration Tests', () => {
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
    mockFs.stat.mockResolvedValue({ size: 1024 * 1024 * 5 } as any);
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

  describe('Configuration Scenarios', () => {
    it('应该处理最小配置场景', async () => {
      const minimalConfig: AppConfig = {
        appName: 'Minimal App',
        packageName: 'com.minimal.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: []
      };

      const buildOptions: BuildOptions = {
        output: './build'
      };

      mockConfigManager.loadConfig.mockResolvedValue(minimalConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/app-debug.apk');

      await cli.build(testConfigPath, buildOptions);

      expect(mockAPKBuilder.initializeProject).toHaveBeenCalledWith(minimalConfig, expect.any(String));
      expect(mockAPKBuilder.buildAPK).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        release: false,
        outputDir: './build'
      }));
    });

    it('应该处理完整配置场景', async () => {
      const fullConfig: AppConfig = {
        appName: 'Full Featured App',
        packageName: 'com.full.app',
        version: '2.1.0',
        webDir: './dist',
        startUrl: 'index.html',
        icon: './assets/icon.png',
        splashScreen: './assets/splash.png',
        orientation: 'landscape',
        permissions: [
          'android.permission.INTERNET',
          'android.permission.ACCESS_NETWORK_STATE',
          'android.permission.CAMERA',
          'android.permission.ACCESS_FINE_LOCATION'
        ]
      };

      const buildOptions: BuildOptions = {
        output: './build',
        release: true,
        minify: true,
        keystore: './release.keystore',
        keystorePassword: 'release123',
        keyAlias: 'release',
        keyPassword: 'key123'
      };

      mockConfigManager.loadConfig.mockResolvedValue(fullConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/app-release.apk');
      mockAPKBuilder.signAPK.mockResolvedValue('/test/output/app-release-signed.apk');

      await cli.build(testConfigPath, buildOptions);

      expect(mockAPKBuilder.initializeProject).toHaveBeenCalledWith(fullConfig, expect.any(String));
      expect(mockAPKBuilder.buildAPK).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        release: true,
        minifyWeb: true,
        outputDir: './build'
      }));
      expect(mockAPKBuilder.signAPK).toHaveBeenCalledWith('/test/output/app-release.apk', {
        path: './release.keystore',
        password: 'release123',
        alias: 'release',
        aliasPassword: 'key123'
      });
    });

    it('应该处理React应用配置场景', async () => {
      const reactConfig: AppConfig = {
        appName: 'React App',
        packageName: 'com.react.app',
        version: '1.0.0',
        webDir: './build',
        startUrl: 'index.html',
        icon: './public/favicon.ico',
        permissions: [
          'android.permission.INTERNET',
          'android.permission.ACCESS_NETWORK_STATE'
        ]
      };

      const buildOptions: BuildOptions = {
        output: './android-build',
        minify: true
      };

      mockConfigManager.loadConfig.mockResolvedValue(reactConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/react-app-debug.apk');

      await cli.build(testConfigPath, buildOptions);

      expect(mockAPKBuilder.initializeProject).toHaveBeenCalledWith(reactConfig, expect.any(String));
      expect(mockAPKBuilder.buildAPK).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        minifyWeb: true,
        outputDir: './android-build'
      }));
    });

    it('应该处理Vue应用配置场景', async () => {
      const vueConfig: AppConfig = {
        appName: 'Vue App',
        packageName: 'com.vue.app',
        version: '3.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        orientation: 'portrait',
        permissions: [
          'android.permission.INTERNET',
          'android.permission.ACCESS_NETWORK_STATE',
          'android.permission.VIBRATE'
        ]
      };

      const buildOptions: BuildOptions = {
        output: './vue-build',
        clean: true
      };

      mockConfigManager.loadConfig.mockResolvedValue(vueConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/vue-app-debug.apk');

      await cli.build(testConfigPath, buildOptions);

      expect(mockFs.rm).toHaveBeenCalledWith('./vue-build', { recursive: true, force: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith('./vue-build', { recursive: true });
      expect(mockAPKBuilder.initializeProject).toHaveBeenCalledWith(vueConfig, expect.any(String));
    });

    it('应该处理PWA配置场景', async () => {
      const pwaConfig: AppConfig = {
        appName: 'PWA App',
        packageName: 'com.pwa.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        icon: './assets/icon-512.png',
        splashScreen: './assets/splash-screen.png',
        orientation: 'any',
        permissions: [
          'android.permission.INTERNET',
          'android.permission.ACCESS_NETWORK_STATE',
          'android.permission.WAKE_LOCK',
          'android.permission.ACCESS_FINE_LOCATION',
          'android.permission.CAMERA'
        ]
      };

      const buildOptions: BuildOptions = {
        output: './pwa-build',
        release: false,
        minify: false
      };

      mockConfigManager.loadConfig.mockResolvedValue(pwaConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/pwa-app-debug.apk');

      await cli.build(testConfigPath, buildOptions);

      expect(mockAPKBuilder.initializeProject).toHaveBeenCalledWith(pwaConfig, expect.any(String));
      expect(mockAPKBuilder.buildAPK).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        release: false,
        minifyWeb: false,
        outputDir: './pwa-build'
      }));
    });
  });

  describe('APK Functionality Verification', () => {
    it('应该验证APK包含正确的权限', async () => {
      const config: AppConfig = {
        appName: 'Permission Test App',
        packageName: 'com.permission.test',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: [
          'android.permission.INTERNET',
          'android.permission.ACCESS_NETWORK_STATE',
          'android.permission.CAMERA',
          'android.permission.ACCESS_FINE_LOCATION'
        ]
      };

      const buildOptions: BuildOptions = {
        output: './build'
      };

      mockConfigManager.loadConfig.mockResolvedValue(config);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/permission-test-debug.apk');

      await cli.build(testConfigPath, buildOptions);

      // 验证权限被正确传递给APK构建器
      expect(mockAPKBuilder.initializeProject).toHaveBeenCalledWith(
        expect.objectContaining({
          permissions: expect.arrayContaining([
            'android.permission.INTERNET',
            'android.permission.ACCESS_NETWORK_STATE',
            'android.permission.CAMERA',
            'android.permission.ACCESS_FINE_LOCATION'
          ])
        }),
        expect.any(String)
      );
    });

    it('应该验证APK包含正确的应用信息', async () => {
      const config: AppConfig = {
        appName: 'App Info Test',
        packageName: 'com.appinfo.test',
        version: '2.5.1',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: []
      };

      const buildOptions: BuildOptions = {
        output: './build'
      };

      mockConfigManager.loadConfig.mockResolvedValue(config);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/appinfo-test-debug.apk');

      await cli.build(testConfigPath, buildOptions);

      // 验证应用信息被正确传递
      expect(mockAPKBuilder.initializeProject).toHaveBeenCalledWith(
        expect.objectContaining({
          appName: 'App Info Test',
          packageName: 'com.appinfo.test',
          version: '2.5.1'
        }),
        expect.any(String)
      );
    });

    it('应该验证APK包含正确的WebView配置', async () => {
      const config: AppConfig = {
        appName: 'WebView Test App',
        packageName: 'com.webview.test',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: ['android.permission.INTERNET']
      };

      const buildOptions: BuildOptions = {
        output: './build'
      };

      mockConfigManager.loadConfig.mockResolvedValue(config);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/webview-test-debug.apk');

      await cli.build(testConfigPath, buildOptions);

      // 验证配置被正确传递
      expect(mockAPKBuilder.initializeProject).toHaveBeenCalledWith(
        expect.objectContaining({
          appName: 'WebView Test App',
          packageName: 'com.webview.test',
          version: '1.0.0'
        }),
        expect.any(String)
      );
    });

    it('应该验证APK签名流程', async () => {
      const config: AppConfig = {
        appName: 'Signing Test App',
        packageName: 'com.signing.test',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: ['android.permission.INTERNET']
      };

      const buildOptions: BuildOptions = {
        output: './build',
        release: true,
        keystore: './test-keystore.jks',
        keystorePassword: 'testpass123',
        keyAlias: 'testkey',
        keyPassword: 'keypass123'
      };

      mockConfigManager.loadConfig.mockResolvedValue(config);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/signing-test-release.apk');
      mockAPKBuilder.signAPK.mockResolvedValue('/test/output/signing-test-release-signed.apk');

      await cli.build(testConfigPath, buildOptions);

      // 验证签名参数正确传递
      expect(mockAPKBuilder.signAPK).toHaveBeenCalledWith(
        '/test/output/signing-test-release.apk',
        expect.objectContaining({
          path: './test-keystore.jks',
          password: 'testpass123',
          alias: 'testkey',
          aliasPassword: 'keypass123'
        })
      );
    });
  });

  describe('Error Scenarios', () => {
    it('应该处理无效包名配置', async () => {
      const invalidConfig: AppConfig = {
        appName: 'Invalid Package App',
        packageName: 'invalid-package-name',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: []
      };

      const buildOptions: BuildOptions = {
        output: './build'
      };

      mockConfigManager.loadConfig.mockResolvedValue(invalidConfig);
      mockConfigManager.validateConfig.mockReturnValue({
        isValid: false,
        errors: [{ field: 'packageName', message: 'Invalid package name format', severity: 'error' }],
        warnings: []
      });

      await expect(cli.build(testConfigPath, buildOptions)).rejects.toThrow('配置文件验证失败');
    });

    it('应该处理缺失资源文件', async () => {
      const config: AppConfig = {
        appName: 'Missing Resource App',
        packageName: 'com.missing.resource',
        version: '1.0.0',
        webDir: './nonexistent',
        startUrl: 'index.html',
        icon: './nonexistent/icon.png',
        permissions: []
      };

      const buildOptions: BuildOptions = {
        output: './build'
      };

      mockConfigManager.loadConfig.mockResolvedValue(config);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockRejectedValue(new Error('Resource file not found'));

      await expect(cli.build(testConfigPath, buildOptions)).rejects.toThrow('Resource file not found');
    });

    it('应该处理签名失败场景', async () => {
      const config: AppConfig = {
        appName: 'Signing Fail App',
        packageName: 'com.signing.fail',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: []
      };

      const buildOptions: BuildOptions = {
        output: './build',
        release: true,
        keystore: './invalid-keystore.jks',
        keystorePassword: 'wrongpass',
        keyAlias: 'wrongalias',
        keyPassword: 'wrongkeypass'
      };

      mockConfigManager.loadConfig.mockResolvedValue(config);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/signing-fail-release.apk');
      mockAPKBuilder.signAPK.mockRejectedValue(new Error('Keystore authentication failed'));

      await expect(cli.build(testConfigPath, buildOptions)).rejects.toThrow('Keystore authentication failed');
    });
  });
});