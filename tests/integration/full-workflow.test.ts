/**
 * 完整工作流程集成测试
 */

import { jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { CLIImpl } from '../../src/cli/CLIImpl.js';
import { CLIErrorHandler } from '../../src/cli/ErrorHandler.js';
import { ConfigManager } from '../../src/config/ConfigManager.js';
import { APKBuilderImpl } from '../../src/apk/APKBuilder.js';
import { ProjectTemplateManager } from '../../src/cli/ProjectTemplateManager.js';
import type { BuildOptions, InitOptions } from '../../src/interfaces/CLI.js';
import type { AppConfig } from '../../src/types/index.js';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('ora');
jest.mock('../../src/config/ConfigManager.js');
jest.mock('../../src/apk/APKBuilder.js');
jest.mock('../../src/cli/ProjectTemplateManager.js');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('Full Workflow Integration Tests', () => {
  let cli: CLIImpl;
  let mockConfigManager: jest.Mocked<ConfigManager>;
  let mockAPKBuilder: jest.Mocked<APKBuilderImpl>;
  let mockTemplateManager: jest.Mocked<ProjectTemplateManager>;
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

    mockTemplateManager = {
      getTemplate: jest.fn(),
      applyTemplate: jest.fn(),
      listTemplates: jest.fn()
    } as any;

    // Mock constructors
    (ConfigManager as jest.MockedClass<typeof ConfigManager>).mockImplementation(() => mockConfigManager);
    (APKBuilderImpl as jest.MockedClass<typeof APKBuilderImpl>).mockImplementation(() => mockAPKBuilder);
    (ProjectTemplateManager as jest.MockedClass<typeof ProjectTemplateManager>).mockImplementation(() => mockTemplateManager);

    // Mock fs operations
    mockFs.access.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ size: 1024 * 1024 * 5 } as any);
    mockFs.rm.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);

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

  describe('Complete Project Lifecycle', () => {
    it('应该完成从初始化到构建的完整流程', async () => {
      // 1. 项目初始化阶段
      const initOptions: InitOptions = {
        name: 'Full Workflow App',
        packageName: 'com.fullworkflow.app',
        template: 'basic',
        interactive: false,
        force: false
      };

      // Mock template manager
      mockTemplateManager.getTemplate.mockReturnValue({
        name: 'basic',
        displayName: 'Basic Template',
        description: 'Basic template',
        files: [
          { path: 'index.html', content: '<html></html>' },
          { path: 'style.css', content: 'body {}' }
        ],
        directories: ['dist', 'assets']
      });
      mockTemplateManager.applyTemplate.mockResolvedValue(undefined);

      // 执行初始化
      await cli.init(testProjectPath, initOptions);

      // 验证初始化步骤
      expect(mockFs.mkdir).toHaveBeenCalledWith(testProjectPath, { recursive: true });
      expect(mockTemplateManager.applyTemplate).toHaveBeenCalledWith(
        'basic',
        testProjectPath,
        expect.objectContaining({
          appName: 'Full Workflow App',
          packageName: 'com.fullworkflow.app'
        })
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        testConfigPath,
        expect.any(String),
        'utf8'
      );

      // 2. 构建阶段
      const config: AppConfig = {
        appName: 'Full Workflow App',
        packageName: 'com.fullworkflow.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: ['android.permission.INTERNET']
      };

      const buildOptions: BuildOptions = {
        output: './build',
        release: false
      };

      // Mock build dependencies
      mockConfigManager.loadConfig.mockResolvedValue(config);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/full-workflow-app-debug.apk');

      // 执行构建
      await cli.build(testConfigPath, buildOptions);

      // 验证构建步骤
      expect(mockConfigManager.loadConfig).toHaveBeenCalledWith(testConfigPath);
      expect(mockAPKBuilder.initializeProject).toHaveBeenCalledWith(config, expect.any(String));
      expect(mockAPKBuilder.buildAPK).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        release: false,
        outputDir: './build'
      }));
    });

    it('应该处理React项目的完整流程', async () => {
      // 1. React项目初始化
      const initOptions: InitOptions = {
        name: 'React Workflow App',
        packageName: 'com.reactworkflow.app',
        template: 'react',
        interactive: false,
        force: false
      };

      mockTemplateManager.getTemplate.mockReturnValue({
        name: 'react',
        displayName: 'React Template',
        description: 'React template',
        files: [
          { path: 'public/index.html', content: '<html></html>' },
          { path: 'src/App.jsx', content: 'import React from "react";' },
          { path: 'package.json', content: '{}' }
        ],
        directories: ['public', 'src', 'build']
      });
      mockTemplateManager.applyTemplate.mockResolvedValue(undefined);

      await cli.init(testProjectPath, initOptions);

      // 2. React项目构建
      const reactConfig: AppConfig = {
        appName: 'React Workflow App',
        packageName: 'com.reactworkflow.app',
        version: '1.0.0',
        webDir: './build',
        startUrl: 'index.html',
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
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/react-workflow-app-debug.apk');

      await cli.build(testConfigPath, buildOptions);

      // 验证React特定配置
      expect(mockAPKBuilder.initializeProject).toHaveBeenCalledWith(
        expect.objectContaining({
          webDir: './build',
          appName: 'React Workflow App',
          packageName: 'com.reactworkflow.app'
        }),
        expect.any(String)
      );
    });

    it('应该处理发布版本的完整流程', async () => {
      // 1. 初始化发布项目
      const initOptions: InitOptions = {
        name: 'Release App',
        packageName: 'com.release.app',
        template: 'basic',
        interactive: false,
        force: false
      };

      mockTemplateManager.getTemplate.mockReturnValue({
        name: 'basic',
        displayName: 'Basic Template',
        description: 'Basic template',
        files: [
          { path: 'index.html', content: '<html></html>' }
        ],
        directories: ['dist', 'assets']
      });
      mockTemplateManager.applyTemplate.mockResolvedValue(undefined);

      await cli.init(testProjectPath, initOptions);

      // 2. 发布版本构建
      const releaseConfig: AppConfig = {
        appName: 'Release App',
        packageName: 'com.release.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        icon: './assets/icon.png',
        splashScreen: './assets/splash.png',
        permissions: ['android.permission.INTERNET']
      };

      const buildOptions: BuildOptions = {
        output: './release-build',
        release: true,
        minify: true,
        keystore: './release.keystore',
        keystorePassword: 'releasepass',
        keyAlias: 'release',
        keyPassword: 'keypass'
      };

      mockConfigManager.loadConfig.mockResolvedValue(releaseConfig);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/release-app-release.apk');
      mockAPKBuilder.signAPK.mockResolvedValue('/test/output/release-app-release-signed.apk');

      await cli.build(testConfigPath, buildOptions);

      // 验证发布版本流程
      expect(mockAPKBuilder.buildAPK).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        release: true,
        minifyWeb: true
      }));
      expect(mockAPKBuilder.signAPK).toHaveBeenCalledWith(
        '/test/output/release-app-release.apk',
        expect.objectContaining({
          path: './release.keystore',
          password: 'releasepass',
          alias: 'release',
          aliasPassword: 'keypass'
        })
      );
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('应该从初始化错误中恢复', async () => {
      const initOptions: InitOptions = {
        name: 'Error Recovery App',
        packageName: 'com.errorrecovery.app',
        template: 'nonexistent',
        interactive: false,
        force: false
      };

      // 模拟模板不存在错误
      mockTemplateManager.getTemplate.mockReturnValue(undefined);

      await expect(cli.init(testProjectPath, initOptions)).rejects.toThrow('模板 "nonexistent" 不存在');

      // 使用正确的模板重试
      const correctedOptions: InitOptions = {
        ...initOptions,
        template: 'basic'
      };

      mockTemplateManager.getTemplate.mockReturnValue({
        name: 'basic',
        displayName: 'Basic Template',
        description: 'Basic template',
        files: [
          { path: 'index.html', content: '<html></html>' }
        ],
        directories: ['dist', 'assets']
      });
      mockTemplateManager.applyTemplate.mockResolvedValue(undefined);

      // 应该成功初始化
      await expect(cli.init(testProjectPath, correctedOptions)).resolves.not.toThrow();
    });

    it('应该从构建错误中恢复', async () => {
      const config: AppConfig = {
        appName: 'Build Error Recovery App',
        packageName: 'com.builderror.app',
        version: '1.0.0',
        webDir: './nonexistent',
        startUrl: 'index.html',
        permissions: []
      };

      const buildOptions: BuildOptions = {
        output: './build'
      };

      // 第一次构建失败
      mockConfigManager.loadConfig.mockResolvedValue(config);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockRejectedValue(new Error('Web directory not found'));

      await expect(cli.build(testConfigPath, buildOptions)).rejects.toThrow('Web directory not found');

      // 修复配置后重试
      const fixedConfig: AppConfig = {
        ...config,
        webDir: './dist'
      };

      mockConfigManager.loadConfig.mockResolvedValue(fixedConfig);
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/build-error-recovery-debug.apk');

      // 应该成功构建
      await expect(cli.build(testConfigPath, buildOptions)).resolves.not.toThrow();
    });
  });

  describe('Performance Integration', () => {
    it('应该在完整流程中保持良好性能', async () => {
      const startTime = Date.now();

      // 1. 快速初始化
      const initOptions: InitOptions = {
        name: 'Performance Test App',
        packageName: 'com.performance.app',
        template: 'basic',
        interactive: false,
        force: false
      };

      mockTemplateManager.getTemplate.mockReturnValue({
        name: 'basic',
        displayName: 'Basic Template',
        description: 'Basic template',
        files: [
          { path: 'index.html', content: '<html></html>' }
        ],
        directories: ['dist', 'assets']
      });
      mockTemplateManager.applyTemplate.mockResolvedValue(undefined);

      await cli.init(testProjectPath, initOptions);

      const initTime = Date.now() - startTime;

      // 2. 快速构建
      const config: AppConfig = {
        appName: 'Performance Test App',
        packageName: 'com.performance.app',
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
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/performance-test-debug.apk');

      const buildStartTime = Date.now();
      await cli.build(testConfigPath, buildOptions);
      const buildTime = Date.now() - buildStartTime;

      const totalTime = Date.now() - startTime;

      // 性能基准
      expect(initTime).toBeLessThan(1000); // 初始化应该在1秒内完成
      expect(buildTime).toBeLessThan(1000); // 构建应该在1秒内完成
      expect(totalTime).toBeLessThan(2000); // 总时间应该在2秒内完成

      console.log(`Init time: ${initTime}ms`);
      console.log(`Build time: ${buildTime}ms`);
      console.log(`Total time: ${totalTime}ms`);
    });
  });

  describe('Resource Management', () => {
    it('应该正确管理资源文件', async () => {
      // 1. 初始化带资源的项目
      const initOptions: InitOptions = {
        name: 'Resource Management App',
        packageName: 'com.resource.app',
        template: 'basic',
        interactive: false,
        force: false
      };

      mockTemplateManager.getTemplate.mockReturnValue({
        name: 'basic',
        displayName: 'Basic Template',
        description: 'Basic template',
        files: [
          { path: 'index.html', content: '<html></html>' },
          { path: 'assets/icon.png', content: 'binary-data' },
          { path: 'assets/splash.png', content: 'binary-data' }
        ],
        directories: ['dist', 'assets']
      });
      mockTemplateManager.applyTemplate.mockResolvedValue(undefined);

      await cli.init(testProjectPath, initOptions);

      // 2. 构建时处理资源
      const config: AppConfig = {
        appName: 'Resource Management App',
        packageName: 'com.resource.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        icon: './assets/icon.png',
        splashScreen: './assets/splash.png',
        permissions: ['android.permission.INTERNET']
      };

      const buildOptions: BuildOptions = {
        output: './build'
      };

      mockConfigManager.loadConfig.mockResolvedValue(config);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true, errors: [], warnings: [] });
      mockAPKBuilder.initializeProject.mockResolvedValue(undefined);
      mockAPKBuilder.buildAPK.mockResolvedValue('/test/output/resource-management-debug.apk');

      await cli.build(testConfigPath, buildOptions);

      // 验证资源文件被正确处理
      expect(mockAPKBuilder.initializeProject).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: './assets/icon.png',
          splashScreen: './assets/splash.png'
        }),
        expect.any(String)
      );
    });
  });
});