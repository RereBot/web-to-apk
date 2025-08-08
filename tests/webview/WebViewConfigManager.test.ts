/**
 * WebView配置管理器测试
 */

import { WebViewConfigManagerImpl } from '../../src/webview/WebViewConfigManager.js';
import type { 
  WebViewConfig, 
  WebViewSettings, 
  WebViewPermissions, 
  NavigationRule 
} from '../../src/interfaces/WebViewConfig.js';

describe('WebViewConfigManager', () => {
  let configManager: WebViewConfigManagerImpl;

  beforeEach(() => {
    configManager = new WebViewConfigManagerImpl();
  });

  describe('createDefaultConfig', () => {
    it('应该创建有效的默认配置', () => {
      const config = configManager.createDefaultConfig();

      expect(config).toBeDefined();
      expect(config.settings).toBeDefined();
      expect(config.permissions).toBeDefined();
      expect(config.securityPolicies).toBeDefined();
      expect(config.navigationRules).toBeDefined();
    });

    it('应该启用JavaScript和DOM存储', () => {
      const config = configManager.createDefaultConfig();

      expect(config.settings.javaScriptEnabled).toBe(true);
      expect(config.settings.domStorageEnabled).toBe(true);
      expect(config.settings.databaseEnabled).toBe(true);
    });

    it('应该包含基本的网络权限', () => {
      const config = configManager.createDefaultConfig();

      expect(config.permissions.internet).toBe(true);
      expect(config.permissions.networkState).toBe(true);
    });

    it('应该包含默认的安全策略', () => {
      const config = configManager.createDefaultConfig();

      expect(config.securityPolicies.length).toBeGreaterThan(0);
      expect(config.securityPolicies.some(p => p.type === 'CSP')).toBe(true);
    });

    it('应该包含默认的导航规则', () => {
      const config = configManager.createDefaultConfig();

      expect(config.navigationRules.length).toBeGreaterThan(0);
      expect(config.navigationRules.some(r => r.action === 'ALLOW')).toBe(true);
      expect(config.navigationRules.some(r => r.action === 'BLOCK')).toBe(true);
    });
  });

  describe('validateConfig', () => {
    let validConfig: WebViewConfig;

    beforeEach(() => {
      validConfig = configManager.createDefaultConfig();
    });

    it('应该验证有效的配置', async () => {
      const isValid = await configManager.validateConfig(validConfig);
      expect(isValid).toBe(true);
    });

    it('应该拒绝无效的缓存大小', async () => {
      validConfig.settings.appCacheMaxSize = -1;
      
      const isValid = await configManager.validateConfig(validConfig);
      expect(isValid).toBe(false);
    });

    it('应该拒绝无效的混合内容模式', async () => {
      (validConfig.settings.mixedContentMode as any) = 'INVALID_MODE';
      
      const isValid = await configManager.validateConfig(validConfig);
      expect(isValid).toBe(false);
    });

    it('应该拒绝无效的缓存模式', async () => {
      (validConfig.settings.cacheMode as any) = 'INVALID_CACHE_MODE';
      
      const isValid = await configManager.validateConfig(validConfig);
      expect(isValid).toBe(false);
    });

    it('应该拒绝无效的安全策略类型', async () => {
      validConfig.securityPolicies.push({
        type: 'INVALID_TYPE' as any,
        policy: 'test',
        enforced: true
      });
      
      const isValid = await configManager.validateConfig(validConfig);
      expect(isValid).toBe(false);
    });

    it('应该拒绝空的安全策略内容', async () => {
      validConfig.securityPolicies.push({
        type: 'CSP',
        policy: '',
        enforced: true
      });
      
      const isValid = await configManager.validateConfig(validConfig);
      expect(isValid).toBe(false);
    });

    it('应该拒绝无效的导航规则动作', async () => {
      validConfig.navigationRules.push({
        pattern: 'https://*',
        action: 'INVALID_ACTION' as any
      });
      
      const isValid = await configManager.validateConfig(validConfig);
      expect(isValid).toBe(false);
    });

    it('应该拒绝空的导航规则模式', async () => {
      validConfig.navigationRules.push({
        pattern: '',
        action: 'ALLOW'
      });
      
      const isValid = await configManager.validateConfig(validConfig);
      expect(isValid).toBe(false);
    });
  });

  describe('generateCapacitorConfig', () => {
    it('应该生成有效的Capacitor配置', async () => {
      const config = configManager.createDefaultConfig();
      const capacitorConfig = await configManager.generateCapacitorConfig(config);

      expect(capacitorConfig).toBeDefined();
      expect(capacitorConfig.plugins).toBeDefined();
      expect(capacitorConfig.server).toBeDefined();
      expect(capacitorConfig.android).toBeDefined();
    });

    it('应该包含WebView调试设置', async () => {
      const config = configManager.createDefaultConfig();
      config.settings.webContentsDebuggingEnabled = true;
      
      const capacitorConfig = await configManager.generateCapacitorConfig(config);
      
      expect(capacitorConfig.android.webContentsDebuggingEnabled).toBe(true);
    });

    it('应该包含混合内容模式设置', async () => {
      const config = configManager.createDefaultConfig();
      config.settings.mixedContentMode = 'NEVER_ALLOW';
      
      const capacitorConfig = await configManager.generateCapacitorConfig(config);
      
      expect(capacitorConfig.android.mixedContentMode).toBe('NEVER_ALLOW');
    });

    it('应该包含文件访问设置', async () => {
      const config = configManager.createDefaultConfig();
      config.settings.allowFileAccess = false;
      
      const capacitorConfig = await configManager.generateCapacitorConfig(config);
      
      expect(capacitorConfig.android.allowFileAccess).toBe(false);
    });

    it('应该包含自定义用户代理', async () => {
      const config = configManager.createDefaultConfig();
      config.settings.userAgent = 'CustomUserAgent/1.0';
      
      const capacitorConfig = await configManager.generateCapacitorConfig(config);
      
      expect(capacitorConfig.plugins?.CapacitorHttp).toBeDefined();
    });

    it('应该包含允许的导航列表', async () => {
      const config = configManager.createDefaultConfig();
      
      const capacitorConfig = await configManager.generateCapacitorConfig(config);
      
      expect(capacitorConfig.server.allowNavigation).toBeDefined();
      expect(Array.isArray(capacitorConfig.server.allowNavigation)).toBe(true);
    });
  });

  describe('generatePermissionsManifest', () => {
    it('应该生成基本的网络权限', async () => {
      const permissions: WebViewPermissions = {
        internet: true,
        networkState: true,
        writeExternalStorage: false,
        readExternalStorage: false,
        camera: false,
        microphone: false,
        location: false,
        vibrate: false,
        wakelock: false,
        systemAlertWindow: false
      };

      const manifest = await configManager.generatePermissionsManifest(permissions);

      expect(manifest).toContain('android.permission.INTERNET');
      expect(manifest).toContain('android.permission.ACCESS_NETWORK_STATE');
    });

    it('应该生成存储权限', async () => {
      const permissions: WebViewPermissions = {
        internet: false,
        networkState: false,
        writeExternalStorage: true,
        readExternalStorage: true,
        camera: false,
        microphone: false,
        location: false,
        vibrate: false,
        wakelock: false,
        systemAlertWindow: false
      };

      const manifest = await configManager.generatePermissionsManifest(permissions);

      expect(manifest).toContain('android.permission.WRITE_EXTERNAL_STORAGE');
      expect(manifest).toContain('android.permission.READ_EXTERNAL_STORAGE');
    });

    it('应该生成设备权限', async () => {
      const permissions: WebViewPermissions = {
        internet: false,
        networkState: false,
        writeExternalStorage: false,
        readExternalStorage: false,
        camera: true,
        microphone: true,
        location: true,
        vibrate: true,
        wakelock: false,
        systemAlertWindow: false
      };

      const manifest = await configManager.generatePermissionsManifest(permissions);

      expect(manifest).toContain('android.permission.CAMERA');
      expect(manifest).toContain('android.permission.RECORD_AUDIO');
      expect(manifest).toContain('android.permission.ACCESS_FINE_LOCATION');
      expect(manifest).toContain('android.permission.ACCESS_COARSE_LOCATION');
      expect(manifest).toContain('android.permission.VIBRATE');
    });

    it('应该生成系统权限', async () => {
      const permissions: WebViewPermissions = {
        internet: false,
        networkState: false,
        writeExternalStorage: false,
        readExternalStorage: false,
        camera: false,
        microphone: false,
        location: false,
        vibrate: false,
        wakelock: true,
        systemAlertWindow: true
      };

      const manifest = await configManager.generatePermissionsManifest(permissions);

      expect(manifest).toContain('android.permission.WAKE_LOCK');
      expect(manifest).toContain('android.permission.SYSTEM_ALERT_WINDOW');
    });

    it('应该只生成启用的权限', async () => {
      const permissions: WebViewPermissions = {
        internet: true,
        networkState: false,
        writeExternalStorage: false,
        readExternalStorage: false,
        camera: false,
        microphone: false,
        location: false,
        vibrate: false,
        wakelock: false,
        systemAlertWindow: false
      };

      const manifest = await configManager.generatePermissionsManifest(permissions);

      expect(manifest).toContain('android.permission.INTERNET');
      expect(manifest).not.toContain('android.permission.ACCESS_NETWORK_STATE');
      expect(manifest).not.toContain('android.permission.CAMERA');
    });
  });

  describe('applySecurityPolicies', () => {
    it('应该应用启用的安全策略', async () => {
      const config = configManager.createDefaultConfig();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await configManager.applySecurityPolicies(config);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('应该跳过未启用的安全策略', async () => {
      const config = configManager.createDefaultConfig();
      config.securityPolicies.forEach(policy => {
        policy.enforced = false;
      });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await configManager.applySecurityPolicies(config);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('应该处理不同类型的安全策略', async () => {
      const config: WebViewConfig = {
        settings: configManager.createDefaultConfig().settings,
        permissions: configManager.createDefaultConfig().permissions,
        securityPolicies: [
          {
            type: 'CSP',
            policy: "default-src 'self'",
            enforced: true
          },
          {
            type: 'CORS',
            policy: 'same-origin',
            enforced: true
          },
          {
            type: 'HTTPS_ONLY',
            policy: 'upgrade-insecure-requests',
            enforced: true
          },
          {
            type: 'CUSTOM',
            policy: 'custom-policy',
            enforced: true
          }
        ],
        navigationRules: []
      };
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await configManager.applySecurityPolicies(config);

      expect(consoleSpy).toHaveBeenCalledTimes(4);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('CSP'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('CORS'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('HTTPS-Only'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('自定义'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('WebView设置验证', () => {
    it('应该验证有效的WebView设置', () => {
      const config = configManager.createDefaultConfig();
      const isValid = (configManager as any).validateSettings(config.settings);
      
      expect(isValid).toBe(true);
    });

    it('应该拒绝负数的缓存大小', () => {
      const settings: WebViewSettings = {
        ...configManager.createDefaultConfig().settings,
        appCacheMaxSize: -100
      };
      
      const isValid = (configManager as any).validateSettings(settings);
      expect(isValid).toBe(false);
    });
  });

  describe('权限验证', () => {
    it('应该验证有效的权限配置', () => {
      const permissions = configManager.createDefaultConfig().permissions;
      const isValid = (configManager as any).validatePermissions(permissions);
      
      expect(isValid).toBe(true);
    });

    it('应该拒绝非布尔值的权限', () => {
      const permissions = {
        ...configManager.createDefaultConfig().permissions,
        internet: 'true' as any
      };
      
      const isValid = (configManager as any).validatePermissions(permissions);
      expect(isValid).toBe(false);
    });
  });

  describe('导航规则生成', () => {
    it('应该生成允许的导航列表', () => {
      const rules: NavigationRule[] = [
        { pattern: 'https://*', action: 'ALLOW' },
        { pattern: 'http://*', action: 'BLOCK' },
        { pattern: 'file://*', action: 'ALLOW' }
      ];
      
      const allowedNavigation = (configManager as any).generateAllowedNavigation(rules);
      
      expect(allowedNavigation).toEqual(['https://*', 'file://*']);
    });
  });
});