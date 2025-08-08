/**
 * 日志清理工具测试
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { LogCleaner } from '../../src/logging/LogCleaner.js';

describe('LogCleaner', () => {
  let testLogDir: string;
  let logCleaner: LogCleaner;

  beforeEach(async () => {
    testLogDir = path.join(os.tmpdir(), `test-log-cleaner-${Date.now()}`);
    await fs.mkdir(testLogDir, { recursive: true });

    logCleaner = new LogCleaner({
      logDirectory: testLogDir,
      maxAge: 7, // 7 days
      maxSize: 1024 * 1024, // 1MB
      keepMinFiles: 2
    });
  });

  afterEach(async () => {
    try {
      await fs.rm(testLogDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('cleanup', () => {
    it('应该删除过期的日志文件', async () => {
      // Create cleaner with keepMinFiles = 0 to allow deletion of old files
      const testCleaner = new LogCleaner({
        logDirectory: testLogDir,
        maxAge: 7, // 7 days
        maxSize: 1024 * 1024, // 1MB
        keepMinFiles: 0 // Allow deletion of all old files
      });

      // Create old log files
      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      await createTestLogFile('web-to-apk-old.log', 'old content', oldDate);
      await createTestLogFile('web-to-apk-recent.log', 'recent content', recentDate);

      const result = await testCleaner.cleanup();

      expect(result.deletedFiles).toContain('web-to-apk-old.log');
      expect(result.deletedFiles).not.toContain('web-to-apk-recent.log');
      expect(result.totalSizeFreed).toBeGreaterThan(0);
      expect(result.remainingFiles).toBe(1);

      // Verify files are actually deleted
      const remainingFiles = await fs.readdir(testLogDir);
      expect(remainingFiles).toContain('web-to-apk-recent.log');
      expect(remainingFiles).not.toContain('web-to-apk-old.log');
    });

    it('应该删除超出大小限制的文件', async () => {
      // Create cleaner with very small size limit
      const smallCleaner = new LogCleaner({
        logDirectory: testLogDir,
        maxAge: 30, // Don't delete by age
        maxSize: 100, // Very small size limit
        keepMinFiles: 1
      });

      // Create multiple files that exceed size limit
      await createTestLogFile('web-to-apk-1.log', 'a'.repeat(50));
      await createTestLogFile('web-to-apk-2.log', 'b'.repeat(50));
      await createTestLogFile('web-to-apk-3.log', 'c'.repeat(50));

      const result = await smallCleaner.cleanup();

      expect(result.deletedFiles.length).toBeGreaterThan(0);
      expect(result.totalSizeFreed).toBeGreaterThan(0);
      expect(result.remainingFiles).toBeGreaterThanOrEqual(1); // Keep minimum files
    });

    it('应该保持最小文件数量', async () => {
      // Create many old files
      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      
      await createTestLogFile('web-to-apk-1.log', 'content1', oldDate);
      await createTestLogFile('web-to-apk-2.log', 'content2', oldDate);
      await createTestLogFile('web-to-apk-3.log', 'content3', oldDate);

      const result = await logCleaner.cleanup();

      expect(result.remainingFiles).toBeGreaterThanOrEqual(2); // keepMinFiles = 2
    });

    it('应该忽略非日志文件', async () => {
      await createTestLogFile('web-to-apk-test.log', 'log content');
      await createTestLogFile('other-file.txt', 'other content');
      await createTestLogFile('web-to-apk-test.txt', 'wrong extension');

      await logCleaner.cleanup();

      // Should not delete non-log files
      const remainingFiles = await fs.readdir(testLogDir);
      expect(remainingFiles).toContain('other-file.txt');
      expect(remainingFiles).toContain('web-to-apk-test.txt');
    });

    it('应该处理不存在的日志目录', async () => {
      const nonExistentCleaner = new LogCleaner({
        logDirectory: '/non/existent/directory',
        maxAge: 7,
        maxSize: 1024 * 1024,
        keepMinFiles: 2
      });

      const result = await nonExistentCleaner.cleanup();

      expect(result.deletedFiles).toEqual([]);
      expect(result.totalSizeFreed).toBe(0);
      expect(result.remainingFiles).toBe(0);
    });
  });

  describe('getStats', () => {
    it('应该返回日志目录统计信息', async () => {
      await createTestLogFile('web-to-apk-1.log', 'content1');
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      await createTestLogFile('web-to-apk-2.log', 'content2');

      const stats = await logCleaner.getStats();

      expect(stats.totalFiles).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.oldestFile).toBeDefined();
      expect(stats.newestFile).toBeDefined();
      expect(stats.oldestFile!.getTime()).toBeLessThanOrEqual(stats.newestFile!.getTime());
    });

    it('应该处理空的日志目录', async () => {
      const stats = await logCleaner.getStats();

      expect(stats.totalFiles).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.oldestFile).toBeUndefined();
      expect(stats.newestFile).toBeUndefined();
    });

    it('应该处理不存在的日志目录', async () => {
      const nonExistentCleaner = new LogCleaner({
        logDirectory: '/non/existent/directory',
        maxAge: 7,
        maxSize: 1024 * 1024,
        keepMinFiles: 2
      });

      const stats = await nonExistentCleaner.getStats();

      expect(stats.totalFiles).toBe(0);
      expect(stats.totalSize).toBe(0);
    });
  });

  // Helper function to create test log files
  async function createTestLogFile(filename: string, content: string, mtime?: Date): Promise<void> {
    const filePath = path.join(testLogDir, filename);
    await fs.writeFile(filePath, content);
    
    if (mtime) {
      await fs.utimes(filePath, mtime, mtime);
    }
  }
});