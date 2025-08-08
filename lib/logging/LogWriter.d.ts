/**
 * 日志写入器实现
 */
import type { LogEntry, LogWriter, LogFormatter } from '../interfaces/Logger.js';
export declare class ConsoleLogWriter implements LogWriter {
    private formatter;
    constructor(formatter: LogFormatter);
    write(entry: LogEntry): Promise<void>;
    close(): Promise<void>;
}
export declare class FileLogWriter implements LogWriter {
    private formatter;
    private logDirectory;
    private maxFileSize;
    private maxFiles;
    private currentLogFile;
    private writeQueue;
    constructor(formatter: LogFormatter, logDirectory: string, maxFileSize?: number, // 10MB
    maxFiles?: number);
    write(entry: LogEntry): Promise<void>;
    close(): Promise<void>;
    private ensureLogDirectory;
    private rotateLogIfNeeded;
    private rotateLogFiles;
    private generateLogFileName;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=LogWriter.d.ts.map