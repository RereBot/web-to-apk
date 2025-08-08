/**
 * 日志系统接口
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    SILENT = 4
}
export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
    category?: string | undefined;
    metadata?: Record<string, any> | undefined;
}
export interface LoggerConfig {
    level: LogLevel;
    enableFileLogging: boolean;
    logDirectory: string;
    maxLogFiles: number;
    maxLogFileSize: number;
    enableConsoleLogging: boolean;
    enableTimestamp: boolean;
    enableColors: boolean;
}
export interface Logger {
    /**
     * 记录调试信息
     */
    debug(message: string, category?: string, metadata?: Record<string, any>): void;
    /**
     * 记录一般信息
     */
    info(message: string, category?: string, metadata?: Record<string, any>): void;
    /**
     * 记录警告信息
     */
    warn(message: string, category?: string, metadata?: Record<string, any>): void;
    /**
     * 记录错误信息
     */
    error(message: string, category?: string, metadata?: Record<string, any>): void;
    /**
     * 设置日志级别
     */
    setLevel(level: LogLevel): void;
    /**
     * 获取当前日志级别
     */
    getLevel(): LogLevel;
    /**
     * 清理旧日志文件
     */
    cleanup(): Promise<void>;
    /**
     * 刷新日志缓冲区
     */
    flush(): Promise<void>;
}
export interface LogFormatter {
    /**
     * 格式化日志条目
     */
    format(entry: LogEntry): string;
}
export interface LogWriter {
    /**
     * 写入日志条目
     */
    write(entry: LogEntry): Promise<void>;
    /**
     * 关闭写入器
     */
    close(): Promise<void>;
}
//# sourceMappingURL=Logger.d.ts.map