/**
 * 日志系统主要实现
 */
import os from 'os';
import path from 'path';
import { ConsoleLogWriter, FileLogWriter } from './LogWriter.js';
import { ConsoleLogFormatter, FileLogFormatter } from './LogFormatter.js';
export class WebToAPKLogger {
    constructor(config) {
        this.writers = [];
        this.config = {
            level: 1, // INFO
            enableFileLogging: true,
            logDirectory: path.join(os.tmpdir(), 'web-to-apk-logs'),
            maxLogFiles: 5,
            maxLogFileSize: 10 * 1024 * 1024, // 10MB
            enableConsoleLogging: true,
            enableTimestamp: true,
            enableColors: true,
            ...config
        };
        this.initializeWriters();
    }
    debug(message, category, metadata) {
        this.log(0, message, category, metadata);
    }
    info(message, category, metadata) {
        this.log(1, message, category, metadata);
    }
    warn(message, category, metadata) {
        this.log(2, message, category, metadata);
    }
    error(message, category, metadata) {
        this.log(3, message, category, metadata);
    }
    setLevel(level) {
        this.config.level = level;
    }
    getLevel() {
        return this.config.level;
    }
    async cleanup() {
        for (const writer of this.writers) {
            if ('cleanup' in writer && typeof writer.cleanup === 'function') {
                await writer.cleanup();
            }
        }
    }
    async flush() {
        for (const writer of this.writers) {
            await writer.close();
        }
    }
    log(level, message, category, metadata) {
        if (level < this.config.level) {
            return;
        }
        const entry = {
            timestamp: new Date(),
            level,
            message,
            category,
            metadata
        };
        // Write to all configured writers
        this.writers.forEach(writer => {
            writer.write(entry).catch(error => {
                // Fallback to console if writer fails
                console.error('Logger write error:', error);
            });
        });
    }
    initializeWriters() {
        this.writers = [];
        // Console writer
        if (this.config.enableConsoleLogging) {
            const consoleFormatter = new ConsoleLogFormatter(this.config.enableColors, this.config.enableTimestamp);
            this.writers.push(new ConsoleLogWriter(consoleFormatter));
        }
        // File writer
        if (this.config.enableFileLogging) {
            const fileFormatter = new FileLogFormatter();
            this.writers.push(new FileLogWriter(fileFormatter, this.config.logDirectory, this.config.maxLogFileSize, this.config.maxLogFiles));
        }
    }
}
// 单例实例
let defaultLogger = null;
export function getLogger(config) {
    if (!defaultLogger) {
        defaultLogger = new WebToAPKLogger(config);
    }
    return defaultLogger;
}
export function setLogger(logger) {
    defaultLogger = logger;
}
// 便捷函数
export function debug(message, category, metadata) {
    getLogger().debug(message, category, metadata);
}
export function info(message, category, metadata) {
    getLogger().info(message, category, metadata);
}
export function warn(message, category, metadata) {
    getLogger().warn(message, category, metadata);
}
export function error(message, category, metadata) {
    getLogger().error(message, category, metadata);
}
//# sourceMappingURL=Logger.js.map