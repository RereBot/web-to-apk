/**
 * CLI实现类
 */
import type { CLI, InitOptions, BuildOptions, ServeOptions } from '../interfaces/CLI.js';
import type { ConfigManager } from '../interfaces/ConfigManager.js';
import type { APKBuilder } from '../interfaces/APKBuilder.js';
import type { ErrorHandler } from '../interfaces/ErrorHandler.js';
import { ProjectTemplateManager } from './ProjectTemplateManager.js';
export declare class CLIImpl implements CLI {
    private errorHandler;
    private configManager;
    private apkBuilder;
    private templateManager;
    constructor(configManager: ConfigManager, apkBuilder: APKBuilder, errorHandler: ErrorHandler, templateManager?: ProjectTemplateManager);
    init(projectPath: string, options: InitOptions): Promise<void>;
    build(configPath: string, options: BuildOptions): Promise<void>;
    serve(options: ServeOptions): Promise<void>;
    /**
     * 交互式配置提示
     */
    private promptForConfig;
    private createDefaultConfig;
    /**
     * 检查项目目录
     */
    private checkProjectDirectory;
    /**
     * 创建资源目录
     */
    private createResourceDirectories;
    /**
     * 生成开发文档
     */
    private generateDevelopmentDocs;
    /**
     * 显示初始化成功信息
     */
    private displayInitializationSuccess;
    private displayBuildInfo;
    private cleanOutputDirectory;
    private processResources;
    private getFileSize;
    private handleBuildError;
    private generateDevelopmentGuide;
    private generateDeploymentGuide;
}
//# sourceMappingURL=CLIImpl.d.ts.map