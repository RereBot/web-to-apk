/**
 * 日志系统主要实现
 */

import os from 'os';
import path from 'path';
import type { Logger, LogLevel, LogEntry, LoggerConfig, LogWriter } from '../interfaces/Logger.js';
import { ConsoleLogWriter, FileLogWriter } from './LogWriter.js';
import { ConsoleLogFormatter, FileLogFormatter } from './LogFormatter.js';

export class WebToAPKLogger implements Logger {
  private config: LoggerConfig;
  private writers: LogWriter[] = [];

  constructor(config?: Partial<LoggerConfig>) {
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

  debug(message: string, category?: string, metadata?: Record<string, any>): void {
    this.log(0, message, category, metadata);
  }

  info(message: string, category?: string, metadata?: Record<string, any>): void {
    this.log(1, message, category, metadata);
  }

  warn(message: string, category?: string, metadata?: Record<string, any>): void {
    this.log(2, message, category, metadata);
  }

  error(message: string, category?: string, metadata?: Record<string, any>): void {
    this.log(3, message, category, metadata);
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  getLevel(): LogLevel {
    return this.config.level;
  }

  async cleanup(): Promise<void> {
    for (const writer of this.writers) {
      if ('cleanup' in writer && typeof writer.cleanup === 'function') {
        await (writer as any).cleanup();
      }
    }
  }

  async flush(): Promise<void> {
    for (const writer of this.writers) {
      await writer.close();
    }
  }

  private log(
    level: LogLevel,
    message: string,
    category?: string,
    metadata?: Record<string, any>
  ): void {
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
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

  private initializeWriters(): void {
    this.writers = [];

    // Console writer
    if (this.config.enableConsoleLogging) {
      const consoleFormatter = new ConsoleLogFormatter(
        this.config.enableColors,
        this.config.enableTimestamp
      );
      this.writers.push(new ConsoleLogWriter(consoleFormatter));
    }

    // File writer
    if (this.config.enableFileLogging) {
      const fileFormatter = new FileLogFormatter();
      this.writers.push(
        new FileLogWriter(
          fileFormatter,
          this.config.logDirectory,
          this.config.maxLogFileSize,
          this.config.maxLogFiles
        )
      );
    }
  }
}

// 单例实例
let defaultLogger: WebToAPKLogger | null = null;

export function getLogger(config?: Partial<LoggerConfig>): WebToAPKLogger {
  if (!defaultLogger) {
    defaultLogger = new WebToAPKLogger(config);
  }
  return defaultLogger;
}

export function setLogger(logger: WebToAPKLogger): void {
  defaultLogger = logger;
}

// 便捷函数
export function debug(message: string, category?: string, metadata?: Record<string, any>): void {
  getLogger().debug(message, category, metadata);
}

export function info(message: string, category?: string, metadata?: Record<string, any>): void {
  getLogger().info(message, category, metadata);
}

export function warn(message: string, category?: string, metadata?: Record<string, any>): void {
  getLogger().warn(message, category, metadata);
}

export function error(message: string, category?: string, metadata?: Record<string, any>): void {
  getLogger().error(message, category, metadata);
}
