/**
 * 构建状态报告器
 */
import type { AppConfig } from '../types/index.js';
import type { BuildOptions } from '../interfaces/CLI.js';
export interface BuildReport {
    startTime: number;
    endTime?: number;
    config: Partial<AppConfig>;
    options: BuildOptions;
    steps: BuildStep[];
    success: boolean;
    error?: Error | undefined;
    apkPath?: string | undefined;
    apkSize?: number | undefined;
}
export interface BuildStep {
    name: string;
    startTime: number;
    endTime?: number;
    success: boolean;
    error?: string | undefined;
    details?: any;
}
export declare class BuildReporter {
    private report;
    constructor(config: Partial<AppConfig>, options: BuildOptions);
    /**
     * 开始一个构建步骤
     */
    startStep(name: string): void;
    /**
     * 完成一个构建步骤
     */
    completeStep(name: string, success?: boolean, error?: string | undefined, details?: any): void;
    /**
     * 完成构建
     */
    completeBuild(success: boolean, apkPath?: string | undefined, apkSize?: number | undefined, error?: Error | undefined): void;
    /**
     * 获取构建报告
     */
    getReport(): BuildReport;
    /**
     * 显示构建摘要
     */
    displaySummary(): void;
    /**
     * 显示详细报告
     */
    displayDetailedReport(): void;
    /**
     * 导出报告为JSON
     */
    exportToJSON(): string;
    /**
     * 保存报告到文件
     */
    saveReport(filePath: string): Promise<void>;
    /**
     * 显示构建建议
     */
    displayRecommendations(): void;
}
//# sourceMappingURL=BuildReporter.d.ts.map