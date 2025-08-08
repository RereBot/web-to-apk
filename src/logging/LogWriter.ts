/**
 * 日志写入器实现
 */

import fs from 'fs/promises';
import path from 'path';
import type { LogEntry, LogWriter, LogFormatter } from '../interfaces/Logger.js';

export class ConsoleLogWriter implements LogWriter {
  private formatter: LogFormatter;

  constructor(formatter: LogFormatter) {
    this.formatter = formatter;
  }

  async write(entry: LogEntry): Promise<void> {
    const formattedMessage = this.formatter.format(entry);

    switch (entry.level) {
    case 0: // DEBUG
    case 1: // INFO
      console.log(formattedMessage);
      break;
    case 2: // WARN
      console.warn(formattedMessage);
      break;
    case 3: // ERROR
      console.error(formattedMessage);
      break;
    }
  }

  async close(): Promise<void> {
    // Console writer doesn't need cleanup
  }
}

export class FileLogWriter implements LogWriter {
  private formatter: LogFormatter;
  private logDirectory: string;
  private maxFileSize: number;
  private maxFiles: number;
  private currentLogFile: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(
    formatter: LogFormatter,
    logDirectory: string,
    maxFileSize: number = 10 * 1024 * 1024, // 10MB
    maxFiles: number = 5
  ) {
    this.formatter = formatter;
    this.logDirectory = logDirectory;
    this.maxFileSize = maxFileSize;
    this.maxFiles = maxFiles;
    this.currentLogFile = this.generateLogFileName();
  }

  async write(entry: LogEntry): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      await this.ensureLogDirectory();
      await this.rotateLogIfNeeded();

      const formattedMessage = this.formatter.format(entry);
      const logFilePath = path.join(this.logDirectory, this.currentLogFile);

      await fs.appendFile(logFilePath, formattedMessage + '\n', 'utf8');
    });

    return this.writeQueue;
  }

  async close(): Promise<void> {
    await this.writeQueue;
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.access(this.logDirectory);
    } catch {
      await fs.mkdir(this.logDirectory, { recursive: true });
    }
  }

  private async rotateLogIfNeeded(): Promise<void> {
    const logFilePath = path.join(this.logDirectory, this.currentLogFile);

    try {
      const stats = await fs.stat(logFilePath);
      if (stats.size >= this.maxFileSize) {
        await this.rotateLogFiles();
        this.currentLogFile = this.generateLogFileName();
      }
    } catch {
      // File doesn't exist, no need to rotate
    }
  }

  private async rotateLogFiles(): Promise<void> {
    const files = await fs.readdir(this.logDirectory);
    const logFiles = files
      .filter(file => file.startsWith('web-to-apk-') && file.endsWith('.log'))
      .sort()
      .reverse();

    // Remove excess files
    if (logFiles.length >= this.maxFiles) {
      const filesToRemove = logFiles.slice(this.maxFiles - 1);
      for (const file of filesToRemove) {
        await fs.unlink(path.join(this.logDirectory, file));
      }
    }
  }

  private generateLogFileName(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `web-to-apk-${timestamp}.log`;
  }

  async cleanup(): Promise<void> {
    await this.rotateLogFiles();
  }
}
