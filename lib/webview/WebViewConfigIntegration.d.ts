/**
 * WebView配置集成工具
 * 用于将WebView配置集成到现有的应用配置系统中
 */
import type { AppConfig } from '../types/index.js';
import type { WebViewConfig } from '../interfaces/WebViewConfig.js';
export declare class WebViewConfigIntegration {
    private webViewConfigManager;
    constructor();
    /**
     * 从应用配置创建WebView配置
     */
    createWebViewConfigFromAppConfig(appConfig: AppConfig): WebViewConfig;
    /**
     * 将WebView权限合并到应用配置中
     */
    mergeWebViewPermissionsToAppConfig(appConfig: AppConfig, webViewConfig: WebViewConfig): Promise<AppConfig>;
    /**
     * 生成Capacitor配置文件内容
     */
    generateCapacitorConfigFile(appConfig: AppConfig, webViewConfig: WebViewConfig): Promise<any>;
    /**
     * 验证WebView配置与应用配置的兼容性
     */
    validateCompatibility(appConfig: AppConfig, webViewConfig: WebViewConfig): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
    /**
     * 生成用户代理字符串
     */
    private generateUserAgent;
    /**
     * 将应用权限映射到WebView权限
     */
    private mapAppPermissionsToWebViewPermissions;
    /**
     * 根据应用配置生成导航规则
     */
    private generateNavigationRules;
    /**
     * 检查URL是否被导航规则允许
     */
    private isUrlAllowedByNavigationRules;
}
//# sourceMappingURL=WebViewConfigIntegration.d.ts.map