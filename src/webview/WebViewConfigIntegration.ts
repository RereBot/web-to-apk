/**
 * WebView配置集成工具
 * 用于将WebView配置集成到现有的应用配置系统中
 */

import type { AppConfig } from '../types/index.js';
import type {
  WebViewConfig,
  WebViewPermissions,
  NavigationRule
} from '../interfaces/WebViewConfig.js';
import { WebViewConfigManagerImpl } from './WebViewConfigManager.js';

export class WebViewConfigIntegration {
  private webViewConfigManager: WebViewConfigManagerImpl;

  constructor() {
    this.webViewConfigManager = new WebViewConfigManagerImpl();
  }

  /**
   * 从应用配置创建WebView配置
   */
  createWebViewConfigFromAppConfig(appConfig: AppConfig): WebViewConfig {
    const defaultConfig = this.webViewConfigManager.createDefaultConfig();

    // 根据应用配置调整WebView设置
    const webViewConfig: WebViewConfig = {
      ...defaultConfig,
      settings: {
        ...defaultConfig.settings,
        // 根据应用配置调整设置
        webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
        userAgent: this.generateUserAgent(appConfig)
      },
      permissions: this.mapAppPermissionsToWebViewPermissions(appConfig.permissions || []),
      navigationRules: this.generateNavigationRules(appConfig)
    };

    return webViewConfig;
  }

  /**
   * 将WebView权限合并到应用配置中
   */
  async mergeWebViewPermissionsToAppConfig(
    appConfig: AppConfig,
    webViewConfig: WebViewConfig
  ): Promise<AppConfig> {
    const webViewPermissions = await this.webViewConfigManager.generatePermissionsManifest(
      webViewConfig.permissions
    );

    // 合并权限，避免重复
    const existingPermissions = new Set(appConfig.permissions || []);
    webViewPermissions.forEach(permission => existingPermissions.add(permission));

    return {
      ...appConfig,
      permissions: Array.from(existingPermissions)
    };
  }

  /**
   * 生成Capacitor配置文件内容
   */
  async generateCapacitorConfigFile(
    appConfig: AppConfig,
    webViewConfig: WebViewConfig
  ): Promise<any> {
    const baseCapacitorConfig =
      await this.webViewConfigManager.generateCapacitorConfig(webViewConfig);

    // 添加应用特定的配置
    const capacitorConfig = {
      ...baseCapacitorConfig,
      appId: appConfig.packageName,
      appName: appConfig.appName,
      webDir: appConfig.webDir || 'dist',
      bundledWebRuntime: false,
      plugins: {
        ...baseCapacitorConfig.plugins,
        SplashScreen: {
          launchShowDuration: 2000,
          backgroundColor: '#ffffff',
          androidSplashResourceName: 'splash',
          androidScaleType: 'CENTER_CROP',
          showSpinner: false,
          androidSpinnerStyle: 'large',
          iosSpinnerStyle: 'small',
          spinnerColor: '#999999',
          splashFullScreen: true,
          splashImmersive: true
        },
        StatusBar: {
          style: 'default',
          backgroundColor: '#000000'
        }
      }
    };

    // 如果有启动URL，添加到配置中
    if (appConfig.startUrl) {
      capacitorConfig.server = {
        ...capacitorConfig.server,
        url: appConfig.startUrl
      };
    }

    return capacitorConfig;
  }

  /**
   * 验证WebView配置与应用配置的兼容性
   */
  async validateCompatibility(
    appConfig: AppConfig,
    webViewConfig: WebViewConfig
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 验证WebView配置本身
    const isWebViewConfigValid = await this.webViewConfigManager.validateConfig(webViewConfig);
    if (!isWebViewConfigValid) {
      errors.push('WebView配置无效');
    }

    // 验证权限兼容性
    if (
      webViewConfig.permissions.internet &&
      !appConfig.permissions?.includes('android.permission.INTERNET')
    ) {
      errors.push('WebView需要网络权限，但应用配置中未包含INTERNET权限');
    }

    // 检查无效权限
    const validPermissions = [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.VIBRATE',
      'android.permission.WAKE_LOCK',
      'android.permission.SYSTEM_ALERT_WINDOW'
    ];

    if (appConfig.permissions) {
      for (const permission of appConfig.permissions) {
        if (!validPermissions.includes(permission)) {
          errors.push(`无效的权限: ${permission}`);
        }
      }
    }

    // 验证导航规则与应用URL的兼容性
    if (appConfig.startUrl) {
      const isStartUrlAllowed = this.isUrlAllowedByNavigationRules(
        appConfig.startUrl,
        webViewConfig.navigationRules
      );
      if (!isStartUrlAllowed) {
        errors.push(`启动URL ${appConfig.startUrl} 不被导航规则允许`);
      }
    }

    // 验证允许导航的URL
    if (appConfig.allowNavigation) {
      for (const url of appConfig.allowNavigation) {
        const isAllowed = this.isUrlAllowedByNavigationRules(url, webViewConfig.navigationRules);
        if (!isAllowed) {
          errors.push(`导航URL ${url} 不被导航规则允许`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 生成用户代理字符串
   */
  private generateUserAgent(appConfig: AppConfig): string {
    const appName = appConfig.appName || 'WebToAPK';
    const version = appConfig.version || '1.0.0';
    const packageName = appConfig.packageName || 'com.example.app';

    return `${appName}/${version} (${packageName}) WebToAPK/1.0`;
  }

  /**
   * 将应用权限映射到WebView权限
   */
  private mapAppPermissionsToWebViewPermissions(appPermissions: string[]): WebViewPermissions {
    const permissions: WebViewPermissions = {
      internet: false,
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

    for (const permission of appPermissions) {
      switch (permission) {
      case 'android.permission.INTERNET':
        permissions.internet = true;
        break;
      case 'android.permission.ACCESS_NETWORK_STATE':
        permissions.networkState = true;
        break;
      case 'android.permission.WRITE_EXTERNAL_STORAGE':
        permissions.writeExternalStorage = true;
        break;
      case 'android.permission.READ_EXTERNAL_STORAGE':
        permissions.readExternalStorage = true;
        break;
      case 'android.permission.CAMERA':
        permissions.camera = true;
        break;
      case 'android.permission.RECORD_AUDIO':
        permissions.microphone = true;
        break;
      case 'android.permission.ACCESS_FINE_LOCATION':
      case 'android.permission.ACCESS_COARSE_LOCATION':
        permissions.location = true;
        break;
      case 'android.permission.VIBRATE':
        permissions.vibrate = true;
        break;
      case 'android.permission.WAKE_LOCK':
        permissions.wakelock = true;
        break;
      case 'android.permission.SYSTEM_ALERT_WINDOW':
        permissions.systemAlertWindow = true;
        break;
      }
    }

    return permissions;
  }

  /**
   * 根据应用配置生成导航规则
   */
  private generateNavigationRules(appConfig: AppConfig): NavigationRule[] {
    const rules: NavigationRule[] = [
      // 默认规则
      {
        pattern: 'file://*',
        action: 'ALLOW' as const,
        description: '允许访问本地文件'
      },
      {
        pattern: 'https://*',
        action: 'ALLOW' as const,
        description: '允许HTTPS连接'
      },
      {
        pattern: 'http://localhost:*',
        action: 'ALLOW' as const,
        description: '允许本地开发服务器'
      }
    ];

    // 添加应用特定的允许导航规则
    if (appConfig.allowNavigation) {
      for (const url of appConfig.allowNavigation) {
        rules.push({
          pattern: url,
          action: 'ALLOW' as const,
          description: `允许导航到 ${url}`
        });
      }
    }

    // 添加阻止规则（放在最后）
    rules.push({
      pattern: 'http://*',
      action: 'BLOCK' as const,
      description: '阻止不安全的HTTP连接'
    });

    return rules;
  }

  /**
   * 检查URL是否被导航规则允许
   */
  private isUrlAllowedByNavigationRules(url: string, rules: any[]): boolean {
    // 相对路径（如 index.html）默认允许
    if (!url.includes('://') && !url.startsWith('/')) {
      return true;
    }

    for (const rule of rules) {
      const regex = new RegExp(rule.pattern.replace(/\*/g, '.*'));
      if (regex.test(url)) {
        return rule.action === 'ALLOW';
      }
    }

    // 默认阻止
    return false;
  }
}
