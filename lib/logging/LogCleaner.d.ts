/**
 * 日志清理工具
 */
export interface LogCleanerConfig {
    logDirectory: string;
    maxAge: number;
    maxSize: number;
    keepMinFiles: number;
}
export declare class LogCleaner {
    private config;
    constructor(config: LogCleanerConfig);
    /**
     * 清理旧的日志文件
     */
    cleanup(): Promise<{
        deletedFiles: string[];
        totalSizeFreed: number;
        remainingFiles: number;
    }>;
    /**
     * 获取日志目录统计信息
     */
    getStats(): Promise<{
        totalFiles: number;
        totalSize: number;
        oldestFile?: Date;
        newestFile?: Date;
    }>;
    private getLogFiles;
    private selectFilesToDelete;
}
//# sourceMappingURL=LogCleaner.d.ts.map