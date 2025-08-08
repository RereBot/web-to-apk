/**
 * WebView配置接口
 */

export interface WebViewSettings {
  // JavaScript执行环境配置
  javaScriptEnabled: boolean;
  domStorageEnabled: boolean;
  databaseEnabled: boolean;
  allowFileAccess: boolean;
  allowFileAccessFromFileURLs: boolean;
  allowUniversalAccessFromFileURLs: boolean;

  // 网络访问和安全策略
  mixedContentMode: 'NEVER_ALLOW' | 'ALWAYS_ALLOW' | 'COMPATIBILITY_MODE';
  allowedOriginRules: string[];
  userAgent?: string;

  // 本地存储和缓存选项
  cacheMode: 'LOAD_DEFAULT' | 'LOAD_CACHE_ELSE_NETWORK' | 'LOAD_NO_CACHE' | 'LOAD_CACHE_ONLY';
  appCacheEnabled: boolean;
  appCachePath?: string;
  appCacheMaxSize?: number;

  // 其他WebView设置
  zoomControlsEnabled: boolean;
  builtInZoomControls: boolean;
  displayZoomControls: boolean;
  loadWithOverviewMode: boolean;
  useWideViewPort: boolean;
  supportMultipleWindows: boolean;

  // 调试和开发选项
  webContentsDebuggingEnabled: boolean;
  allowContentAccess: boolean;
}

export interface WebViewPermissions {
  // 网络权限
  internet: boolean;
  networkState: boolean;

  // 存储权限
  writeExternalStorage: boolean;
  readExternalStorage: boolean;

  // 设备权限
  camera: boolean;
  microphone: boolean;
  location: boolean;
  vibrate: boolean;

  // 系统权限
  wakelock: boolean;
  systemAlertWindow: boolean;
}

export interface WebViewConfig {
  settings: WebViewSettings;
  permissions: WebViewPermissions;
  securityPolicies: SecurityPolicy[];
  navigationRules: NavigationRule[];
}

export interface SecurityPolicy {
  type: 'CSP' | 'CORS' | 'HTTPS_ONLY' | 'CUSTOM';
  policy: string;
  enforced: boolean;
}

export interface NavigationRule {
  pattern: string;
  action: 'ALLOW' | 'BLOCK' | 'EXTERNAL';
  description?: string;
}

export interface WebViewConfigManager {
  /**
   * 创建默认WebView配置
   */
  createDefaultConfig(): WebViewConfig;

  /**
   * 验证WebView配置
   */
  validateConfig(config: WebViewConfig): Promise<boolean>;

  /**
   * 生成Capacitor WebView配置
   */
  generateCapacitorConfig(config: WebViewConfig): Promise<any>;

  /**
   * 生成Android权限清单
   */
  generatePermissionsManifest(permissions: WebViewPermissions): Promise<string[]>;

  /**
   * 应用安全策略
   */
  applySecurityPolicies(config: WebViewConfig): Promise<void>;
}
