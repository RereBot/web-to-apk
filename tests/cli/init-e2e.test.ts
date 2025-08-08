/**
 * 初始化命令端到端测试
 */

import { jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { CLIImpl } from '../../src/cli/CLIImpl.js';
import { ConfigManager } from '../../src/config/ConfigManager.js';
import { APKBuilderImpl } from '../../src/apk/APKBuilder.js';
import { CLIErrorHandler } from '../../src/cli/ErrorHandler.js';
import type { InitOptions } from '../../src/interfaces/CLI.js';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('ora');
jest.mock('inquirer');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('Init E2E Tests', () => {
  let cli: CLIImpl;
  let testProjectPath: string;

  beforeEach(() => {
    const errorHandler = new CLIErrorHandler();
    const configManager = new ConfigManager(errorHandler);
    const apkBuilder = new APKBuilderImpl();
    cli = new CLIImpl(configManager, apkBuilder, errorHandler);
    testProjectPath = '/test/my-app';
    
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

    // Mock fs operations
    mockFs.access.mockRejectedValue(new Error('ENOENT')); // Directory doesn't exist
    mockFs.readdir.mockResolvedValue([] as any);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ size: 1024 } as any);

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Non-Interactive Mode', () => {
    it('应该成功初始化基础项目', async () => {
      const options: InitOptions = {
        name: 'Test App',
        packageName: 'com.test.app',
        template: 'basic',
        interactive: false,
        force: false
      };

      await cli.init(testProjectPath, options);

      // Verify directory creation
      expect(mockFs.mkdir).toHaveBeenCalledWith(testProjectPath, { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith(path.join(testProjectPath, 'src'), { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith(path.join(testProjectPath, 'dist'), { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith(path.join(testProjectPath, 'assets'), { recursive: true });

      // Verify resource directories
      expect(mockFs.mkdir).toHaveBeenCalledWith(path.join(testProjectPath, 'assets/icons'), { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith(path.join(testProjectPath, 'assets/splash'), { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith(path.join(testProjectPath, 'assets/images'), { recursive: true });

      // Verify config file creation
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(testProjectPath, 'web-to-apk.config.json'),
        expect.stringContaining('"appName": "Test App"'),
        'utf8'
      );

      // Verify documentation files
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(testProjectPath, 'DEVELOPMENT.md'),
        expect.stringContaining('# 开发指南'),
        'utf8'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(testProjectPath, 'DEPLOYMENT.md'),
        expect.stringContaining('# 部署指南'),
        'utf8'
      );
    });

    it('应该成功初始化React项目', async () => {
      const options: InitOptions = {
        name: 'React Test App',
        packageName: 'com.test.reactapp',
        template: 'react',
        interactive: false,
        force: false
      };

      await cli.init(testProjectPath, options);

      // Verify React-specific directories
      expect(mockFs.mkdir).toHaveBeenCalledWith(path.join(testProjectPath, 'public'), { recursive: true });

      // Verify config contains React app name
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(testProjectPath, 'web-to-apk.config.json'),
        expect.stringContaining('"appName": "React Test App"'),
        'utf8'
      );
    });

    it('应该使用默认配置当选项缺失时', async () => {
      const options: InitOptions = {
        interactive: false,
        force: false
      };

      await cli.init(testProjectPath, options);

      // Verify default config values
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(testProjectPath, 'web-to-apk.config.json'),
        expect.stringContaining('"appName": "My Web App"'),
        'utf8'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(testProjectPath, 'web-to-apk.config.json'),
        expect.stringContaining('"packageName": "com.example.myapp"'),
        'utf8'
      );
    });
  });

  describe('Interactive Mode', () => {
    beforeEach(() => {
      // Mock inquirer responses
      const inquirer = require('inquirer');
      inquirer.prompt.mockImplementation((questions: any[]) => {
        const responses: any = {};
        
        questions.forEach(q => {
          switch (q.name) {
            case 'appName':
              responses.appName = 'Interactive App';
              break;
            case 'packageName':
              responses.packageName = 'com.interactive.app';
              break;
            case 'version':
              responses.version = '1.0.0';
              break;
            case 'template':
              responses.template = 'basic';
              break;
            case 'webDir':
              responses.webDir = './dist';
              break;
            case 'startUrl':
              responses.startUrl = 'index.html';
              break;
            case 'orientation':
              responses.orientation = 'portrait';
              break;
            case 'permissions':
              responses.permissions = ['android.permission.INTERNET'];
              break;
          }
        });
        
        return Promise.resolve(responses);
      });
    });

    it('应该成功执行交互式初始化', async () => {
      const options: InitOptions = {
        interactive: true,
        force: false
      };

      await cli.init(testProjectPath, options);

      // Verify inquirer was called
      const inquirer = require('inquirer');
      expect(inquirer.prompt).toHaveBeenCalled();

      // Verify config file contains interactive responses
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(testProjectPath, 'web-to-apk.config.json'),
        expect.stringContaining('"appName": "Interactive App"'),
        'utf8'
      );
    });

    it('应该显示配置摘要', async () => {
      const options: InitOptions = {
        interactive: true,
        force: false
      };

      await cli.init(testProjectPath, options);

      // Verify summary was displayed
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('配置完成'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Interactive App'));
    });
  });

  describe('Template Processing', () => {
    it('应该正确处理基础模板文件', async () => {
      const options: InitOptions = {
        name: 'Template Test',
        packageName: 'com.template.test',
        template: 'basic',
        interactive: false,
        force: false
      };

      await cli.init(testProjectPath, options);

      // Verify HTML file contains app name
      const htmlCall = (mockFs.writeFile as jest.Mock).mock.calls.find(
        (call: any) => call[0].endsWith('index.html')
      );
      expect(htmlCall).toBeDefined();
      expect(htmlCall![1]).toContain('Template Test');
      expect(htmlCall![1]).toContain('<!DOCTYPE html>');

      // Verify README contains project info
      const readmeCall = (mockFs.writeFile as jest.Mock).mock.calls.find(
        (call: any) => call[0].endsWith('README.md')
      );
      expect(readmeCall).toBeDefined();
      expect(readmeCall![1]).toContain('# Template Test');
      expect(readmeCall![1]).toContain('com.template.test');
    });

    it('应该创建.gitignore文件', async () => {
      const options: InitOptions = {
        template: 'basic',
        interactive: false,
        force: false
      };

      await cli.init(testProjectPath, options);

      // Verify .gitignore was created
      const gitignoreCall = (mockFs.writeFile as jest.Mock).mock.calls.find(
        (call: any) => call[0].endsWith('.gitignore')
      );
      expect(gitignoreCall).toBeDefined();
      expect(gitignoreCall![1]).toContain('node_modules/');
      expect(gitignoreCall![1]).toContain('*.apk');
    });
  });

  describe('Error Handling', () => {
    it('应该处理目录已存在的情况', async () => {
      mockFs.access.mockResolvedValue(undefined); // Directory exists
      mockFs.readdir.mockResolvedValue(['existing-file.txt'] as any);

      const options: InitOptions = {
        interactive: false,
        force: false
      };

      await expect(cli.init(testProjectPath, options)).rejects.toThrow('不为空');
    });

    it('应该在force模式下覆盖现有目录', async () => {
      mockFs.access.mockResolvedValue(undefined); // Directory exists
      mockFs.readdir.mockResolvedValue(['existing-file.txt'] as any);

      const options: InitOptions = {
        interactive: false,
        force: true
      };

      await cli.init(testProjectPath, options);

      // Should not throw error and should proceed with initialization
      expect(mockFs.writeFile).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('覆盖现有文件'));
    });

    it('应该处理无效的模板名称', async () => {
      const options: InitOptions = {
        template: 'nonexistent-template',
        interactive: false,
        force: false
      };

      await expect(cli.init(testProjectPath, options)).rejects.toThrow('模板');
    });

    it('应该处理文件写入错误', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('Permission denied'));

      const options: InitOptions = {
        interactive: false,
        force: false
      };

      await expect(cli.init(testProjectPath, options)).rejects.toThrow('Permission denied');
    });
  });

  describe('Success Display', () => {
    it('应该显示初始化成功信息', async () => {
      const options: InitOptions = {
        name: 'Success Test',
        packageName: 'com.success.test',
        template: 'basic',
        interactive: false,
        force: false
      };

      await cli.init(testProjectPath, options);

      // Verify success message
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('项目初始化成功'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Success Test'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('com.success.test'));
    });

    it('应该显示下一步指导', async () => {
      const options: InitOptions = {
        interactive: false,
        force: false
      };

      await cli.init(testProjectPath, options);

      // Verify next steps guidance
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('下一步'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('web-to-apk build'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('README.md'));
    });

    it('应该显示有用的提示', async () => {
      const options: InitOptions = {
        interactive: false,
        force: false
      };

      await cli.init(testProjectPath, options);

      // Verify helpful tips
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('提示'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('web-to-apk serve'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('web-to-apk help'));
    });
  });

  describe('Configuration Generation', () => {
    it('应该生成有效的配置文件', async () => {
      const options: InitOptions = {
        name: 'Config Test',
        packageName: 'com.config.test',
        template: 'basic',
        interactive: false,
        force: false
      };

      await cli.init(testProjectPath, options);

      // Find the config file write call
      const configCall = (mockFs.writeFile as jest.Mock).mock.calls.find(
        (call: any) => call[0].endsWith('web-to-apk.config.json')
      );
      
      expect(configCall).toBeDefined();
      
      const configContent = JSON.parse(configCall![1] as string);
      expect(configContent.appName).toBe('Config Test');
      expect(configContent.packageName).toBe('com.config.test');
      expect(configContent.version).toBe('1.0.0');
      expect(configContent.webDir).toBe('./dist');
      expect(configContent.startUrl).toBe('index.html');
      expect(configContent.permissions).toContain('android.permission.INTERNET');
    });

    it('应该包含默认权限', async () => {
      const options: InitOptions = {
        interactive: false,
        force: false
      };

      await cli.init(testProjectPath, options);

      const configCall = (mockFs.writeFile as jest.Mock).mock.calls.find(
        (call: any) => call[0].endsWith('web-to-apk.config.json')
      );
      
      const configContent = JSON.parse(configCall![1] as string);
      expect(configContent.permissions).toContain('android.permission.INTERNET');
      expect(configContent.permissions).toContain('android.permission.ACCESS_NETWORK_STATE');
    });
  });

  describe('Documentation Generation', () => {
    it('应该生成开发指南', async () => {
      const options: InitOptions = {
        template: 'basic',
        interactive: false,
        force: false
      };

      await cli.init(testProjectPath, options);

      const devGuideCall = (mockFs.writeFile as jest.Mock).mock.calls.find(
        (call: any) => call[0].endsWith('DEVELOPMENT.md')
      );
      
      expect(devGuideCall).toBeDefined();
      expect(devGuideCall![1]).toContain('# 开发指南');
      expect(devGuideCall![1]).toContain('基础模板');
      expect(devGuideCall![1]).toContain('web-to-apk serve');
    });

    it('应该生成部署指南', async () => {
      const options: InitOptions = {
        interactive: false,
        force: false
      };

      await cli.init(testProjectPath, options);

      const deployGuideCall = (mockFs.writeFile as jest.Mock).mock.calls.find(
        (call: any) => call[0].endsWith('DEPLOYMENT.md')
      );
      
      expect(deployGuideCall).toBeDefined();
      expect(deployGuideCall![1]).toContain('# 部署指南');
      expect(deployGuideCall![1]).toContain('keytool');
      expect(deployGuideCall![1]).toContain('--release');
    });
  });

  describe('Project Structure', () => {
    it('应该创建完整的项目结构', async () => {
      const options: InitOptions = {
        template: 'basic',
        interactive: false,
        force: false
      };

      await cli.init(testProjectPath, options);

      // Verify all expected directories were created
      const expectedDirs = [
        testProjectPath,
        path.join(testProjectPath, 'src'),
        path.join(testProjectPath, 'dist'),
        path.join(testProjectPath, 'assets'),
        path.join(testProjectPath, 'assets/icons'),
        path.join(testProjectPath, 'assets/splash'),
        path.join(testProjectPath, 'assets/images')
      ];

      expectedDirs.forEach(dir => {
        expect(mockFs.mkdir).toHaveBeenCalledWith(dir, { recursive: true });
      });
    });

    it('应该创建所有必需的文件', async () => {
      const options: InitOptions = {
        template: 'basic',
        interactive: false,
        force: false
      };

      await cli.init(testProjectPath, options);

      // Verify all expected files were created
      const expectedFiles = [
        'web-to-apk.config.json',
        'dist/index.html',
        'README.md',
        '.gitignore',
        'DEVELOPMENT.md',
        'DEPLOYMENT.md'
      ];

      expectedFiles.forEach(file => {
        expect(mockFs.writeFile).toHaveBeenCalledWith(
          path.join(testProjectPath, file),
          expect.any(String),
          expect.any(String) // encoding parameter
        );
      });
    });
  });
});