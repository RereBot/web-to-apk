/**
 * 日志格式化器实现
 */
import type { LogEntry, LogFormatter } from '../interfaces/Logger.js';
export declare class ConsoleLogFormatter implements LogFormatter {
    private enableColors;
    private enableTimestamp;
    constructor(enableColors?: boolean, enableTimestamp?: boolean);
    format(entry: LogEntry): string;
    private formatLevel;
}
export declare class FileLogFormatter implements LogFormatter {
    format(entry: LogEntry): string;
    private getLevelName;
}
export declare class JSONLogFormatter implements LogFormatter {
    format(entry: LogEntry): string;
    private getLevelName;
}
//# sourceMappingURL=LogFormatter.d.ts.map