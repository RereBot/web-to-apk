/**
 * 日志清理工具
 */

import fs from 'fs/promises';
import path from 'path';

export interface LogCleanerConfig {
  logDirectory: string;
  maxAge: number; // in days
  maxSize: number; // in bytes
  keepMinFiles: number;
}

export class LogCleaner {
  private config: LogCleanerConfig;

  constructor(config: LogCleanerConfig) {
    this.config = config;
  }

  /**
   * 清理旧的日志文件
   */
  async cleanup(): Promise<{
    deletedFiles: string[];
    totalSizeFreed: number;
    remainingFiles: number;
  }> {
    const deletedFiles: string[] = [];
    let totalSizeFreed = 0;

    try {
      const files = await this.getLogFiles();
      const filesToDelete = await this.selectFilesToDelete(files);

      for (const file of filesToDelete) {
        const filePath = path.join(this.config.logDirectory, file.name);
        try {
          await fs.unlink(filePath);
          deletedFiles.push(file.name);
          totalSizeFreed += file.size;
        } catch (error) {
          console.warn(`Failed to delete log file ${file.name}:`, error);
        }
      }

      return {
        deletedFiles,
        totalSizeFreed,
        remainingFiles: files.length - deletedFiles.length
      };
    } catch (error) {
      console.error('Log cleanup failed:', error);
      return {
        deletedFiles: [],
        totalSizeFreed: 0,
        remainingFiles: 0
      };
    }
  }

  /**
   * 获取日志目录统计信息
   */
  async getStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile?: Date;
    newestFile?: Date;
  }> {
    try {
      const files = await this.getLogFiles();

      if (files.length === 0) {
        return {
          totalFiles: 0,
          totalSize: 0
        };
      }

      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const dates = files.map(file => file.mtime).sort();

      return {
        totalFiles: files.length,
        totalSize,
        oldestFile: dates[0],
        newestFile: dates[dates.length - 1]
      };
    } catch (error) {
      console.error('Failed to get log stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0
      };
    }
  }

  private async getLogFiles(): Promise<
    Array<{
      name: string;
      size: number;
      mtime: Date;
    }>
    > {
    try {
      await fs.access(this.config.logDirectory);
    } catch {
      return [];
    }

    const entries = await fs.readdir(this.config.logDirectory);
    const logFiles = entries.filter(
      entry => entry.startsWith('web-to-apk-') && entry.endsWith('.log')
    );

    const files = [];
    for (const fileName of logFiles) {
      try {
        const filePath = path.join(this.config.logDirectory, fileName);
        const stats = await fs.stat(filePath);
        files.push({
          name: fileName,
          size: stats.size,
          mtime: stats.mtime
        });
      } catch (error) {
        console.warn(`Failed to stat log file ${fileName}:`, error);
      }
    }

    return files;
  }

  private async selectFilesToDelete(
    files: Array<{
      name: string;
      size: number;
      mtime: Date;
    }>
  ): Promise<
    Array<{
      name: string;
      size: number;
      mtime: Date;
    }>
  > {
    const now = new Date();
    const maxAgeMs = this.config.maxAge * 24 * 60 * 60 * 1000;

    // Sort files by modification time (oldest first)
    const sortedFiles = files.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

    const filesToDelete = [];
    let totalSize = files.reduce((sum, file) => sum + file.size, 0);

    for (const file of sortedFiles) {
      const remainingFiles = files.length - filesToDelete.length;

      const shouldDelete =
        // Delete if too old (but keep minimum files)
        (now.getTime() - file.mtime.getTime() > maxAgeMs &&
          remainingFiles > this.config.keepMinFiles) ||
        // Delete if total size exceeds limit (but keep minimum files)
        (totalSize > this.config.maxSize && remainingFiles > this.config.keepMinFiles);

      if (shouldDelete) {
        filesToDelete.push(file);
        totalSize -= file.size;
      }
    }

    return filesToDelete;
  }
}
