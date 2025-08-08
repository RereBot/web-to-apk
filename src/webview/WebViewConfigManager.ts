/**
 * WebView配置管理器实现
 */

import type {
  WebViewConfig,
  WebViewSettings,
  WebViewPermissions,
  SecurityPolicy,
  NavigationRule,
  WebViewConfigManager
} from '../interfaces/WebViewConfig.js';

export class WebViewConfigManagerImpl implements WebViewConfigManager {
  /**
   * 创建默认WebView配置
   */
  createDefaultConfig(): WebViewConfig {
    const defaultSettings: WebViewSettings = {
      // JavaScript执行环境配置
      javaScriptEnabled: true,
      domStorageEnabled: true,
      databaseEnabled: true,
      allowFileAccess: true,
      allowFileAccessFromFileURLs: false,
      allowUniversalAccessFromFileURLs: false,

      // 网络访问和安全策略
      mixedContentMode: 'COMPATIBILITY_MODE',
      allowedOriginRules: ['*'],

      // 本地存储和缓存选项
      cacheMode: 'LOAD_DEFAULT',
      appCacheEnabled: true,
      appCacheMaxSize: 50 * 1024 * 1024, // 50MB

      // 其他WebView设置
      zoomControlsEnabled: false,
      builtInZoomControls: true,
      displayZoomControls: false,
      loadWithOverviewMode: true,
      useWideViewPort: true,
      supportMultipleWindows: false,

      // 调试和开发选项
      webContentsDebuggingEnabled: false,
      allowContentAccess: true
    };

    const defaultPermissions: WebViewPermissions = {
      // 网络权限
      internet: true,
      networkState: true,

      // 存储权限
      writeExternalStorage: false,
      readExternalStorage: false,

      // 设备权限
      camera: false,
      microphone: false,
      location: false,
      vibrate: false,

      // 系统权限
      wakelock: false,
      systemAlertWindow: false
    };

    const defaultSecurityPolicies: SecurityPolicy[] = [
      {
        type: 'CSP',
        policy:
          'default-src \'self\' \'unsafe-inline\' \'unsafe-eval\' data: gap: https://ssl.gstatic.com; style-src \'self\' \'unsafe-inline\'; media-src *',
        enforced: true
      },
      {
        type: 'HTTPS_ONLY',
        policy: 'upgrade-insecure-requests',
        enforced: false
      }
    ];

    const defaultNavigationRules: NavigationRule[] = [
      {
        pattern: 'file://*',
        action: 'ALLOW',
        description: '允许访问本地文件'
      },
      {
        pattern: 'https://*',
        action: 'ALLOW',
        description: '允许HTTPS连接'
      },
      {
        pattern: 'http://localhost:*',
        action: 'ALLOW',
        description: '允许本地开发服务器'
      },
      {
        pattern: 'http://*',
        action: 'BLOCK',
        description: '阻止不安全的HTTP连接'
      }
    ];

    return {
      settings: defaultSettings,
      permissions: defaultPermissions,
      securityPolicies: defaultSecurityPolicies,
      navigationRules: defaultNavigationRules
    };
  }

  /**
   * 验证WebView配置
   */
  async validateConfig(config: WebViewConfig): Promise<boolean> {
    try {
      // 验证设置
      if (!this.validateSettings(config.settings)) {
        return false;
      }

      // 验证权限
      if (!this.validatePermissions(config.permissions)) {
        return false;
      }

      // 验证安全策略
      if (!this.validateSecurityPolicies(config.securityPolicies)) {
        return false;
      }

      // 验证导航规则
      if (!this.validateNavigationRules(config.navigationRules)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('WebView配置验证失败:', error);
      return false;
    }
  }

  /**
   * 生成Capacitor WebView配置
   */
  async generateCapacitorConfig(config: WebViewConfig): Promise<any> {
    const capacitorConfig = {
      plugins: {
        CapacitorHttp: {
          enabled: true
        },
        CapacitorCookies: {
          enabled: true
        }
      },
      server: {
        androidScheme: 'https',
        allowNavigation: this.generateAllowedNavigation(config.navigationRules)
      },
      android: {
        webContentsDebuggingEnabled: config.settings.webContentsDebuggingEnabled,
        mixedContentMode: config.settings.mixedContentMode,
        captureInput: true,
        webSecurity: true,
        allowFileAccess: config.settings.allowFileAccess,
        allowFileAccessFromFileURLs: config.settings.allowFileAccessFromFileURLs,
        allowUniversalAccessFromFileURLs: config.settings.allowUniversalAccessFromFileURLs
      }
    };

    // 添加WebView配置
    if (config.settings.userAgent || config.settings.appCachePath) {
      capacitorConfig.plugins = {
        ...capacitorConfig.plugins,
        CapacitorHttp: {
          enabled: true
        }
      };
    }

    return capacitorConfig;
  }

  /**
   * 生成Android权限清单
   */
  async generatePermissionsManifest(permissions: WebViewPermissions): Promise<string[]> {
    const manifestPermissions: string[] = [];

    // 网络权限
    if (permissions.internet) {
      manifestPermissions.push('android.permission.INTERNET');
    }
    if (permissions.networkState) {
      manifestPermissions.push('android.permission.ACCESS_NETWORK_STATE');
    }

    // 存储权限
    if (permissions.writeExternalStorage) {
      manifestPermissions.push('android.permission.WRITE_EXTERNAL_STORAGE');
    }
    if (permissions.readExternalStorage) {
      manifestPermissions.push('android.permission.READ_EXTERNAL_STORAGE');
    }

    // 设备权限
    if (permissions.camera) {
      manifestPermissions.push('android.permission.CAMERA');
    }
    if (permissions.microphone) {
      manifestPermissions.push('android.permission.RECORD_AUDIO');
    }
    if (permissions.location) {
      manifestPermissions.push('android.permission.ACCESS_FINE_LOCATION');
      manifestPermissions.push('android.permission.ACCESS_COARSE_LOCATION');
    }
    if (permissions.vibrate) {
      manifestPermissions.push('android.permission.VIBRATE');
    }

    // 系统权限
    if (permissions.wakelock) {
      manifestPermissions.push('android.permission.WAKE_LOCK');
    }
    if (permissions.systemAlertWindow) {
      manifestPermissions.push('android.permission.SYSTEM_ALERT_WINDOW');
    }

    return manifestPermissions;
  }

  /**
   * 应用安全策略
   */
  async applySecurityPolicies(config: WebViewConfig): Promise<void> {
    for (const policy of config.securityPolicies) {
      if (!policy.enforced) {
        continue;
      }

      switch (policy.type) {
      case 'CSP':
        await this.applyContentSecurityPolicy(policy.policy);
        break;
      case 'CORS':
        await this.applyCorsPolicy(policy.policy);
        break;
      case 'HTTPS_ONLY':
        await this.applyHttpsOnlyPolicy(policy.policy);
        break;
      case 'CUSTOM':
        await this.applyCustomPolicy(policy.policy);
        break;
      }
    }
  }

  /**
   * 验证WebView设置
   */
  private validateSettings(settings: WebViewSettings): boolean {
    // 验证缓存大小
    if (settings.appCacheMaxSize && settings.appCacheMaxSize < 0) {
      console.error('应用缓存大小不能为负数');
      return false;
    }

    // 验证混合内容模式
    const validMixedContentModes = ['NEVER_ALLOW', 'ALWAYS_ALLOW', 'COMPATIBILITY_MODE'];
    if (!validMixedContentModes.includes(settings.mixedContentMode)) {
      console.error('无效的混合内容模式');
      return false;
    }

    // 验证缓存模式
    const validCacheModes = [
      'LOAD_DEFAULT',
      'LOAD_CACHE_ELSE_NETWORK',
      'LOAD_NO_CACHE',
      'LOAD_CACHE_ONLY'
    ];
    if (!validCacheModes.includes(settings.cacheMode)) {
      console.error('无效的缓存模式');
      return false;
    }

    return true;
  }

  /**
   * 验证权限配置
   */
  private validatePermissions(permissions: WebViewPermissions): boolean {
    // 基本验证 - 确保所有权限都是布尔值
    const permissionKeys = Object.keys(permissions) as (keyof WebViewPermissions)[];

    for (const key of permissionKeys) {
      if (typeof permissions[key] !== 'boolean') {
        console.error(`权限 ${key} 必须是布尔值`);
        return false;
      }
    }

    return true;
  }

  /**
   * 验证安全策略
   */
  private validateSecurityPolicies(policies: SecurityPolicy[]): boolean {
    const validTypes = ['CSP', 'CORS', 'HTTPS_ONLY', 'CUSTOM'];

    for (const policy of policies) {
      if (!validTypes.includes(policy.type)) {
        console.error(`无效的安全策略类型: ${policy.type}`);
        return false;
      }

      if (!policy.policy || policy.policy.trim().length === 0) {
        console.error('安全策略内容不能为空');
        return false;
      }

      if (typeof policy.enforced !== 'boolean') {
        console.error('安全策略的enforced属性必须是布尔值');
        return false;
      }
    }

    return true;
  }

  /**
   * 验证导航规则
   */
  private validateNavigationRules(rules: NavigationRule[]): boolean {
    const validActions = ['ALLOW', 'BLOCK', 'EXTERNAL'];

    for (const rule of rules) {
      if (!rule.pattern || rule.pattern.trim().length === 0) {
        console.error('导航规则模式不能为空');
        return false;
      }

      if (!validActions.includes(rule.action)) {
        console.error(`无效的导航规则动作: ${rule.action}`);
        return false;
      }

      // 验证模式是否为有效的URL模式
      try {
        new RegExp(rule.pattern.replace(/\*/g, '.*'));
      } catch (error) {
        console.error(`无效的导航规则模式: ${rule.pattern}`);
        return false;
      }
    }

    return true;
  }

  /**
   * 生成允许的导航列表
   */
  private generateAllowedNavigation(rules: NavigationRule[]): string[] {
    return rules.filter(rule => rule.action === 'ALLOW').map(rule => rule.pattern);
  }

  /**
   * 应用内容安全策略
   */
  private async applyContentSecurityPolicy(policy: string): Promise<void> {
    // 这里可以实现CSP策略的应用逻辑
    console.log(`应用CSP策略: ${policy}`);
  }

  /**
   * 应用CORS策略
   */
  private async applyCorsPolicy(policy: string): Promise<void> {
    // 这里可以实现CORS策略的应用逻辑
    console.log(`应用CORS策略: ${policy}`);
  }

  /**
   * 应用HTTPS-Only策略
   */
  private async applyHttpsOnlyPolicy(policy: string): Promise<void> {
    // 这里可以实现HTTPS-Only策略的应用逻辑
    console.log(`应用HTTPS-Only策略: ${policy}`);
  }

  /**
   * 应用自定义策略
   */
  private async applyCustomPolicy(policy: string): Promise<void> {
    // 这里可以实现自定义策略的应用逻辑
    console.log(`应用自定义策略: ${policy}`);
  }
}
