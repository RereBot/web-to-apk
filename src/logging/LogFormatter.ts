/**
 * 日志格式化器实现
 */

import chalk from 'chalk';
import type { LogEntry, LogFormatter, LogLevel } from '../interfaces/Logger.js';

export class ConsoleLogFormatter implements LogFormatter {
  private enableColors: boolean;
  private enableTimestamp: boolean;

  constructor(enableColors = true, enableTimestamp = true) {
    this.enableColors = enableColors;
    this.enableTimestamp = enableTimestamp;
  }

  format(entry: LogEntry): string {
    const parts: string[] = [];

    // 添加时间戳
    if (this.enableTimestamp) {
      const timestamp = entry.timestamp.toISOString();
      parts.push(this.enableColors ? chalk.gray(timestamp) : timestamp);
    }

    // 添加日志级别
    const levelStr = this.formatLevel(entry.level);
    parts.push(levelStr);

    // 添加分类
    if (entry.category) {
      const categoryStr = `[${entry.category}]`;
      parts.push(this.enableColors ? chalk.cyan(categoryStr) : categoryStr);
    }

    // 添加消息
    parts.push(entry.message);

    // 添加元数据
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      const metadataStr = JSON.stringify(entry.metadata, null, 2);
      parts.push(this.enableColors ? chalk.gray(metadataStr) : metadataStr);
    }

    return parts.join(' ');
  }

  private formatLevel(level: LogLevel): string {
    const levelNames = {
      [0]: 'DEBUG',
      [1]: 'INFO',
      [2]: 'WARN',
      [3]: 'ERROR',
      [4]: 'SILENT'
    };

    const levelName = levelNames[level] || 'UNKNOWN';

    if (!this.enableColors) {
      return `[${levelName}]`;
    }

    switch (level) {
    case 0: // DEBUG
      return chalk.magenta(`[${levelName}]`);
    case 1: // INFO
      return chalk.blue(`[${levelName}]`);
    case 2: // WARN
      return chalk.yellow(`[${levelName}]`);
    case 3: // ERROR
      return chalk.red(`[${levelName}]`);
    default:
      return chalk.gray(`[${levelName}]`);
    }
  }
}

export class FileLogFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = this.getLevelName(entry.level);
    const category = entry.category ? `[${entry.category}]` : '';
    const metadata = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';

    return `${timestamp} [${level}] ${category} ${entry.message}${metadata}`;
  }

  private getLevelName(level: LogLevel): string {
    const levelNames = {
      [0]: 'DEBUG',
      [1]: 'INFO',
      [2]: 'WARN',
      [3]: 'ERROR',
      [4]: 'SILENT'
    };
    return levelNames[level] || 'UNKNOWN';
  }
}

export class JSONLogFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    return JSON.stringify({
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      levelName: this.getLevelName(entry.level),
      category: entry.category,
      message: entry.message,
      metadata: entry.metadata
    });
  }

  private getLevelName(level: LogLevel): string {
    const levelNames = {
      [0]: 'DEBUG',
      [1]: 'INFO',
      [2]: 'WARN',
      [3]: 'ERROR',
      [4]: 'SILENT'
    };
    return levelNames[level] || 'UNKNOWN';
  }
}
