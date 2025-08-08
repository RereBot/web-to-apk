/**
 * 日志系统主要实现
 */
import type { Logger, LogLevel, LoggerConfig } from '../interfaces/Logger.js';
export declare class WebToAPKLogger implements Logger {
    private config;
    private writers;
    constructor(config?: Partial<LoggerConfig>);
    debug(message: string, category?: string, metadata?: Record<string, any>): void;
    info(message: string, category?: string, metadata?: Record<string, any>): void;
    warn(message: string, category?: string, metadata?: Record<string, any>): void;
    error(message: string, category?: string, metadata?: Record<string, any>): void;
    setLevel(level: LogLevel): void;
    getLevel(): LogLevel;
    cleanup(): Promise<void>;
    flush(): Promise<void>;
    private log;
    private initializeWriters;
}
export declare function getLogger(config?: Partial<LoggerConfig>): WebToAPKLogger;
export declare function setLogger(logger: WebToAPKLogger): void;
export declare function debug(message: string, category?: string, metadata?: Record<string, any>): void;
export declare function info(message: string, category?: string, metadata?: Record<string, any>): void;
export declare function warn(message: string, category?: string, metadata?: Record<string, any>): void;
export declare function error(message: string, category?: string, metadata?: Record<string, any>): void;
//# sourceMappingURL=Logger.d.ts.map