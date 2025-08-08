/**
 * WebView配置管理器实现
 */
import type { WebViewConfig, WebViewPermissions, WebViewConfigManager } from '../interfaces/WebViewConfig.js';
export declare class WebViewConfigManagerImpl implements WebViewConfigManager {
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
    /**
     * 验证WebView设置
     */
    private validateSettings;
    /**
     * 验证权限配置
     */
    private validatePermissions;
    /**
     * 验证安全策略
     */
    private validateSecurityPolicies;
    /**
     * 验证导航规则
     */
    private validateNavigationRules;
    /**
     * 生成允许的导航列表
     */
    private generateAllowedNavigation;
    /**
     * 应用内容安全策略
     */
    private applyContentSecurityPolicy;
    /**
     * 应用CORS策略
     */
    private applyCorsPolicy;
    /**
     * 应用HTTPS-Only策略
     */
    private applyHttpsOnlyPolicy;
    /**
     * 应用自定义策略
     */
    private applyCustomPolicy;
}
//# sourceMappingURL=WebViewConfigManager.d.ts.map