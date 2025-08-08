/**
 * WebView配置集成测试
 */

import { WebViewConfigIntegration } from '../../src/webview/WebViewConfigIntegration.js';
import type { AppConfig } from '../../src/types/index.js';
import type { WebViewConfig } from '../../src/interfaces/WebViewConfig.js';

describe('WebViewConfigIntegration', () => {
  let webViewConfigIntegration: WebViewConfigIntegration;

  // Helper function to create a complete AppConfig
  const createAppConfig = (overrides: Partial<AppConfig> = {}): AppConfig => ({
    appName: 'My Sample App',
    packageName: 'com.example.mysampleapp',
    version: '1.0.0',
    webDir: './dist',
    startUrl: 'index.html',
    permissions: ['android.permission.INTERNET'],
    ...overrides
  });

  beforeEach(() => {
    webViewConfigIntegration = new WebViewConfigIntegration();
  });

  describe('createWebViewConfigFromAppConfig', () => {
    it('应该从应用配置创建WebView配置', () => {
      const appConfig = createAppConfig();

      const webViewConfig = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig);

      expect(webViewConfig).toBeDefined();
      expect(webViewConfig.settings).toBeDefined();
      expect(webViewConfig.permissions).toBeDefined();
      expect(webViewConfig.permissions.internet).toBe(true);
    });

    it('应该生成自定义用户代理', () => {
      const appConfig = createAppConfig({
        appName: 'My Custom App',
        packageName: 'com.custom.app',
        version: '2.0.0'
      });

      const webViewConfig = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig);

      expect(webViewConfig.settings.userAgent).toContain('My Custom App');
      expect(webViewConfig.settings.userAgent).toContain('2.0.0');
    });

    it('应该在开发环境启用调试', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const appConfig = createAppConfig();

      const webViewConfig = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig);

      expect(webViewConfig.settings.webContentsDebuggingEnabled).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('应该根据allowNavigation生成导航规则', () => {
      const appConfig = createAppConfig({
        allowNavigation: [
          'https://api.example.com/*',
          'https://cdn.example.com/*'
        ]
      });

      const webViewConfig = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig);

      expect(webViewConfig.navigationRules.some(
        rule => rule.pattern === 'https://api.example.com/*' && rule.action === 'ALLOW'
      )).toBe(true);
      expect(webViewConfig.navigationRules.some(
        rule => rule.pattern === 'https://cdn.example.com/*' && rule.action === 'ALLOW'
      )).toBe(true);
    });

    it('应该配置权限映射', () => {
      const appConfig = createAppConfig({
        permissions: [
          'android.permission.INTERNET',
          'android.permission.CAMERA',
          'android.permission.ACCESS_FINE_LOCATION'
        ]
      });

      const webViewConfig = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig);

      expect(webViewConfig.permissions.internet).toBe(true);
      expect(webViewConfig.permissions.camera).toBe(true);
      expect(webViewConfig.permissions.location).toBe(true);
    });
  });

  describe('mergeWebViewPermissionsToAppConfig', () => {
    it('应该将WebView权限合并到应用配置', async () => {
      const appConfig = createAppConfig();

      const webViewConfig: WebViewConfig = {
        settings: {} as any,
        permissions: {
          internet: true,
          networkState: true,
          camera: true,
          writeExternalStorage: false,
          readExternalStorage: false,
          microphone: false,
          location: false,
          vibrate: false,
          wakelock: false,
          systemAlertWindow: false
        },
        securityPolicies: [],
        navigationRules: []
      };

      const mergedConfig = await webViewConfigIntegration.mergeWebViewPermissionsToAppConfig(
        appConfig,
        webViewConfig
      );

      expect(mergedConfig.permissions).toContain('android.permission.INTERNET');
      expect(mergedConfig.permissions).toContain('android.permission.ACCESS_NETWORK_STATE');
      expect(mergedConfig.permissions).toContain('android.permission.CAMERA');
    });

    it('应该避免重复权限', async () => {
      const appConfig = createAppConfig({
        permissions: [
          'android.permission.INTERNET',
          'android.permission.CAMERA'
        ]
      });

      const webViewConfig: WebViewConfig = {
        settings: {} as any,
        permissions: {
          internet: true,
          camera: true,
          networkState: false,
          writeExternalStorage: false,
          readExternalStorage: false,
          microphone: false,
          location: false,
          vibrate: false,
          wakelock: false,
          systemAlertWindow: false
        },
        securityPolicies: [],
        navigationRules: []
      };

      const mergedConfig = await webViewConfigIntegration.mergeWebViewPermissionsToAppConfig(
        appConfig,
        webViewConfig
      );

      const internetPermissions = mergedConfig.permissions.filter(
        (p: string) => p === 'android.permission.INTERNET'
      );
      expect(internetPermissions).toHaveLength(1);
    });
  });

  describe('generateCapacitorConfigFile', () => {
    it('应该生成完整的Capacitor配置', async () => {
      const appConfig = createAppConfig();

      const webViewConfig = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig);
      const capacitorConfig = await webViewConfigIntegration.generateCapacitorConfigFile(
        appConfig,
        webViewConfig
      );

      expect(capacitorConfig).toBeDefined();
      expect(capacitorConfig.appId).toBe(appConfig.packageName);
      expect(capacitorConfig.appName).toBe(appConfig.appName);
      expect(capacitorConfig.webDir).toBe(appConfig.webDir);
    });

    it('应该包含启动URL配置', async () => {
      const appConfig = createAppConfig();

      const webViewConfig = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig);
      const capacitorConfig = await webViewConfigIntegration.generateCapacitorConfigFile(
        appConfig,
        webViewConfig
      );

      expect(capacitorConfig.server?.url).toBeDefined();
    });

    it('应该包含SplashScreen配置', async () => {
      const appConfig = createAppConfig();

      const webViewConfig = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig);
      const capacitorConfig = await webViewConfigIntegration.generateCapacitorConfigFile(
        appConfig,
        webViewConfig
      );

      expect(capacitorConfig.plugins?.SplashScreen).toBeDefined();
    });
  });

  describe('validateCompatibility', () => {
    it('应该验证兼容的配置', async () => {
      const appConfig = createAppConfig();

      const webViewConfig = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig);
      const validation = await webViewConfigIntegration.validateCompatibility(appConfig, webViewConfig);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('应该检测权限不兼容', async () => {
      const appConfig = createAppConfig({
        permissions: ['invalid.permission']
      });

      const webViewConfig = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig);

      const validation = await webViewConfigIntegration.validateCompatibility(appConfig, webViewConfig);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((error: any) =>
        typeof error === 'string' && error.includes('权限')
      )).toBe(true);
    });

    it('应该检测导航规则冲突', async () => {
      const appConfig = createAppConfig();

      const webViewConfig = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig);
      const validation = await webViewConfigIntegration.validateCompatibility(appConfig, webViewConfig);

      expect(validation.errors.some((error: any) =>
        error.type === 'NAVIGATION_CONFLICT'
      )).toBe(false);
    });

    it('应该检测allowNavigation URL冲突', async () => {
      const appConfig = createAppConfig({
        allowNavigation: ['https://example.com/*']
      });

      const webViewConfig = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig);
      const validation = await webViewConfigIntegration.validateCompatibility(appConfig, webViewConfig);

      expect(validation.errors.some((error: any) =>
        error.type === 'URL_CONFLICT'
      )).toBe(false);
    });
  });

  describe('权限映射', () => {
    it('应该正确映射所有权限类型', () => {
      const appConfig = createAppConfig({
        permissions: [
          'android.permission.INTERNET',
          'android.permission.CAMERA',
          'android.permission.ACCESS_FINE_LOCATION',
          'android.permission.ACCESS_COARSE_LOCATION',
          'android.permission.RECORD_AUDIO',
          'android.permission.WRITE_EXTERNAL_STORAGE',
          'android.permission.READ_EXTERNAL_STORAGE',
          'android.permission.VIBRATE',
          'android.permission.WAKE_LOCK',
          'android.permission.SYSTEM_ALERT_WINDOW'
        ]
      });

      const webViewConfig = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig);

      expect(webViewConfig.permissions.internet).toBe(true);
      expect(webViewConfig.permissions.camera).toBe(true);
      expect(webViewConfig.permissions.location).toBe(true);
      expect(webViewConfig.permissions.microphone).toBe(true);
      expect(webViewConfig.permissions.writeExternalStorage).toBe(true);
      expect(webViewConfig.permissions.readExternalStorage).toBe(true);
      expect(webViewConfig.permissions.vibrate).toBe(true);
      expect(webViewConfig.permissions.wakelock).toBe(true);
      expect(webViewConfig.permissions.systemAlertWindow).toBe(true);
    });

    it('应该处理位置权限的多种形式', () => {
      const appConfig1 = createAppConfig({
        permissions: ['android.permission.ACCESS_FINE_LOCATION']
      });
      const appConfig2 = createAppConfig({
        permissions: ['android.permission.ACCESS_COARSE_LOCATION']
      });

      const webViewConfig1 = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig1);
      const webViewConfig2 = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig2);

      expect(webViewConfig1.permissions.location).toBe(true);
      expect(webViewConfig2.permissions.location).toBe(true);
    });
  });

  describe('用户代理生成', () => {
    it('应该生成包含应用信息的用户代理', () => {
      const appConfig = createAppConfig({
        appName: 'My Sample App',
        packageName: 'com.example.mysampleapp',
        version: '3.1.4'
      });

      const webViewConfig = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig);

      expect(webViewConfig.settings.userAgent).toContain('My Sample App');
      expect(webViewConfig.settings.userAgent).toContain('3.1.4');
    });

    it('应该处理缺失的应用信息', () => {
      const appConfig = createAppConfig({
        appName: '',
        version: ''
      });

      const webViewConfig = webViewConfigIntegration.createWebViewConfigFromAppConfig(appConfig);

      expect(webViewConfig.settings.userAgent).toBeDefined();
      expect(webViewConfig.settings.userAgent?.length || 0).toBeGreaterThan(0);
    });
  });
});