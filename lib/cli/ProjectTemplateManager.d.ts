/**
 * 项目模板管理器
 */
import type { AppConfig } from '../types/index.js';
export interface ProjectTemplate {
    name: string;
    displayName: string;
    description: string;
    files: TemplateFile[];
    directories: string[];
    dependencies?: string[];
    devDependencies?: string[];
}
export interface TemplateFile {
    path: string;
    content: string | ((config: Partial<AppConfig>) => string);
    executable?: boolean;
}
export declare class ProjectTemplateManager {
    private templates;
    constructor();
    /**
     * 初始化内置模板
     */
    private initializeTemplates;
    /**
     * 获取可用模板列表
     */
    getAvailableTemplates(): ProjectTemplate[];
    /**
     * 获取指定模板
     */
    getTemplate(name: string): ProjectTemplate | undefined;
    /**
     * 应用模板到项目目录
     */
    applyTemplate(templateName: string, projectPath: string, config: Partial<AppConfig>): Promise<void>;
    /**
     * 基础HTML模板
     */
    private getBasicIndexHtml;
    /**
     * 基础README模板
     */
    private getBasicReadme;
    /**
     * Git忽略文件模板
     */
    private getGitignore;
    /**
     * React HTML模板
     */
    private getReactIndexHtml;
    /**
     * React App组件模板
     */
    private getReactApp;
}
//# sourceMappingURL=ProjectTemplateManager.d.ts.map