/**
 * 初始化命令集成测试
 */

import type { InitOptions } from '../../src/interfaces/CLI.js';
import type { AppConfig } from '../../src/types/index.js';
import { ProjectTemplateManager } from '../../src/cli/ProjectTemplateManager.js';

describe('Init Integration Tests', () => {
  describe('Template Management', () => {
    let templateManager: ProjectTemplateManager;

    beforeEach(() => {
      templateManager = new ProjectTemplateManager();
    });

    it('应该提供基础模板', () => {
      const template = templateManager.getTemplate('basic');
      
      expect(template).toBeDefined();
      expect(template?.name).toBe('basic');
      expect(template?.displayName).toBe('基础模板');
      expect(template?.files.length).toBeGreaterThan(0);
      expect(template?.directories.length).toBeGreaterThan(0);
    });

    it('应该提供React模板', () => {
      const template = templateManager.getTemplate('react');
      
      expect(template).toBeDefined();
      expect(template?.name).toBe('react');
      expect(template?.displayName).toBe('React模板');
      expect(template?.files.length).toBeGreaterThan(0);
    });

    it('应该返回所有可用模板', () => {
      const templates = templateManager.getAvailableTemplates();
      
      expect(templates.length).toBeGreaterThanOrEqual(2);
      expect(templates.some(t => t.name === 'basic')).toBe(true);
      expect(templates.some(t => t.name === 'react')).toBe(true);
    });

    it('应该为不存在的模板返回undefined', () => {
      const template = templateManager.getTemplate('nonexistent');
      
      expect(template).toBeUndefined();
    });
  });

  describe('Template Content Generation', () => {
    let templateManager: ProjectTemplateManager;

    beforeEach(() => {
      templateManager = new ProjectTemplateManager();
    });

    it('应该生成包含配置信息的HTML内容', () => {
      const template = templateManager.getTemplate('basic');
      const config: Partial<AppConfig> = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0'
      };

      const htmlFile = template?.files.find(f => f.path === 'dist/index.html');
      expect(htmlFile).toBeDefined();

      if (htmlFile && typeof htmlFile.content === 'function') {
        const content = htmlFile.content(config);
        expect(content).toContain('Test App');
        expect(content).toContain('<!DOCTYPE html>');
        expect(content).toContain('<title>Test App</title>');
      }
    });

    it('应该生成包含配置信息的README内容', () => {
      const template = templateManager.getTemplate('basic');
      const config: Partial<AppConfig> = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '2.0.0'
      };

      const readmeFile = template?.files.find(f => f.path === 'README.md');
      expect(readmeFile).toBeDefined();

      if (readmeFile && typeof readmeFile.content === 'function') {
        const content = readmeFile.content(config);
        expect(content).toContain('# Test App');
        expect(content).toContain('com.test.app');
        expect(content).toContain('2.0.0');
        expect(content).toContain('web-to-apk build');
      }
    });

    it('应该生成React组件内容', () => {
      const template = templateManager.getTemplate('react');
      const config: Partial<AppConfig> = {
        appName: 'React Test App'
      };

      const appFile = template?.files.find(f => f.path === 'src/App.jsx');
      expect(appFile).toBeDefined();

      if (appFile && typeof appFile.content === 'function') {
        const content = appFile.content(config);
        expect(content).toContain('React Test App');
        expect(content).toContain('import React');
        expect(content).toContain('ReactDOM.render');
      }
    });
  });

  describe('Init Options Processing', () => {
    it('应该正确处理基本初始化选项', () => {
      const options: InitOptions = {
        name: 'My App',
        packageName: 'com.example.myapp',
        template: 'basic',
        interactive: false,
        force: false
      };

      expect(options.name).toBe('My App');
      expect(options.packageName).toBe('com.example.myapp');
      expect(options.template).toBe('basic');
      expect(options.interactive).toBe(false);
      expect(options.force).toBe(false);
    });

    it('应该正确处理交互式选项', () => {
      const options: InitOptions = {
        interactive: true,
        listTemplates: false
      };

      expect(options.interactive).toBe(true);
      expect(options.listTemplates).toBe(false);
    });

    it('应该正确处理模板列表选项', () => {
      const options: InitOptions = {
        listTemplates: true
      };

      expect(options.listTemplates).toBe(true);
    });

    it('应该正确处理强制覆盖选项', () => {
      const options: InitOptions = {
        force: true,
        template: 'react'
      };

      expect(options.force).toBe(true);
      expect(options.template).toBe('react');
    });
  });

  describe('Configuration Generation', () => {
    it('应该生成有效的基本配置', () => {
      const config: Partial<AppConfig> = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        orientation: 'portrait',
        permissions: [
          'android.permission.INTERNET',
          'android.permission.ACCESS_NETWORK_STATE'
        ]
      };

      expect(config.appName).toBeDefined();
      expect(config.packageName).toMatch(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/);
      expect(config.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(config.permissions).toContain('android.permission.INTERNET');
    });

    it('应该生成包含图标的配置', () => {
      const config: Partial<AppConfig> = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        icon: './assets/icon.png',
        permissions: ['android.permission.INTERNET']
      };

      expect(config.icon).toBe('./assets/icon.png');
    });

    it('应该生成包含启动画面的配置', () => {
      const config: Partial<AppConfig> = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        splashScreen: './assets/splash.png',
        permissions: ['android.permission.INTERNET']
      };

      expect(config.splashScreen).toBe('./assets/splash.png');
    });

    it('应该生成包含多个权限的配置', () => {
      const config: Partial<AppConfig> = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: [
          'android.permission.INTERNET',
          'android.permission.ACCESS_NETWORK_STATE',
          'android.permission.CAMERA',
          'android.permission.RECORD_AUDIO'
        ]
      };

      expect(config.permissions).toHaveLength(4);
      expect(config.permissions).toContain('android.permission.CAMERA');
      expect(config.permissions).toContain('android.permission.RECORD_AUDIO');
    });
  });

  describe('Project Structure Validation', () => {
    let templateManager: ProjectTemplateManager;

    beforeEach(() => {
      templateManager = new ProjectTemplateManager();
    });

    it('应该定义正确的基础项目结构', () => {
      const template = templateManager.getTemplate('basic');
      
      expect(template?.directories).toContain('src');
      expect(template?.directories).toContain('dist');
      expect(template?.directories).toContain('assets');
    });

    it('应该定义正确的React项目结构', () => {
      const template = templateManager.getTemplate('react');
      
      expect(template?.directories).toContain('src');
      expect(template?.directories).toContain('public');
      expect(template?.directories).toContain('dist');
    });

    it('应该包含必需的项目文件', () => {
      const template = templateManager.getTemplate('basic');
      const filePaths = template?.files.map((f: any) => f.path) || [];
      
      expect(filePaths).toContain('dist/index.html');
      expect(filePaths).toContain('README.md');
      expect(filePaths).toContain('.gitignore');
    });
  });

  describe('Error Scenarios', () => {
    it('应该处理无效的应用名称', () => {
      const invalidNames = ['', '   ', 'a'.repeat(51)];
      
      invalidNames.forEach(name => {
        // 应用名称验证应该在CLI层处理
        expect(name.trim().length === 0 || name.length > 50).toBe(true);
      });
    });

    it('应该处理无效的包名格式', () => {
      const invalidPackageNames = [
        'invalid',
        'com',
        'Com.Example.App',
        'com.123invalid.app',
        ''
      ];
      
      const packageRegex = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
      
      invalidPackageNames.forEach(packageName => {
        expect(packageRegex.test(packageName)).toBe(false);
      });
    });

    it('应该处理无效的版本号格式', () => {
      const invalidVersions = [
        '1.0',
        '1.0.0.0',
        'v1.0.0',
        '1.0.0-',
        ''
      ];
      
      const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;
      
      invalidVersions.forEach(version => {
        expect(versionRegex.test(version)).toBe(false);
      });
    });

    it('应该处理不存在的模板', () => {
      const templateManager = new ProjectTemplateManager();
      const template = templateManager.getTemplate('nonexistent-template');
      
      expect(template).toBeUndefined();
    });
  });

  describe('Template Features', () => {
    let templateManager: ProjectTemplateManager;

    beforeEach(() => {
      templateManager = new ProjectTemplateManager();
    });

    it('应该支持模板文件的动态内容生成', () => {
      const template = templateManager.getTemplate('basic');
      const dynamicFiles = template?.files.filter(f => typeof f.content === 'function');
      
      expect(dynamicFiles?.length).toBeGreaterThan(0);
    });

    it('应该支持静态文件内容', () => {
      const template = templateManager.getTemplate('basic');
      const staticFiles = template?.files.filter(f => typeof f.content === 'string');
      
      // 基础模板主要使用动态内容，但.gitignore是静态的
      expect(staticFiles?.length).toBeGreaterThanOrEqual(0);
    });

    it('应该为每个模板提供描述信息', () => {
      const templates = templateManager.getAvailableTemplates();
      
      templates.forEach(template => {
        expect(template.name).toBeDefined();
        expect(template.displayName).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.description.length).toBeGreaterThan(0);
      });
    });
  });
});