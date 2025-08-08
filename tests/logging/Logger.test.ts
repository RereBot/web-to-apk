/**
 * 日志系统单元测试
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { WebToAPKLogger, getLogger, setLogger } from '../../src/logging/Logger.js';
import { LogLevel } from '../../src/interfaces/Logger.js';

describe('WebToAPKLogger', () => {
  let testLogDir: string;
  let logger: WebToAPKLogger;

  beforeEach(async () => {
    // Create temporary log directory
    testLogDir = path.join(os.tmpdir(), `test-logs-${Date.now()}`);
    await fs.mkdir(testLogDir, { recursive: true });

    logger = new WebToAPKLogger({
      level: LogLevel.DEBUG, // Enable all log levels
      logDirectory: testLogDir,
      enableConsoleLogging: false, // Disable console for tests
      enableFileLogging: true
    });
  });

  afterEach(async () => {
    await logger.flush();
    
    // Clean up test log directory
    try {
      await fs.rm(testLogDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('基本日志功能', () => {
    it('应该记录不同级别的日志', async () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      await logger.flush();

      const logFiles = await fs.readdir(testLogDir);
      expect(logFiles.length).toBeGreaterThan(0);

      const logContent = await fs.readFile(path.join(testLogDir, logFiles[0]), 'utf8');
      expect(logContent).toContain('Debug message');
      expect(logContent).toContain('Info message');
      expect(logContent).toContain('Warning message');
      expect(logContent).toContain('Error message');
    });

    it('应该根据日志级别过滤消息', async () => {
      logger.setLevel(LogLevel.WARN);

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      await logger.flush();

      const logFiles = await fs.readdir(testLogDir);
      const logContent = await fs.readFile(path.join(testLogDir, logFiles[0]), 'utf8');
      
      expect(logContent).not.toContain('Debug message');
      expect(logContent).not.toContain('Info message');
      expect(logContent).toContain('Warning message');
      expect(logContent).toContain('Error message');
    });

    it('应该包含分类和元数据', async () => {
      logger.info('Test message', 'TEST_CATEGORY', { key: 'value', number: 42 });

      await logger.flush();

      const logFiles = await fs.readdir(testLogDir);
      const logContent = await fs.readFile(path.join(testLogDir, logFiles[0]), 'utf8');
      
      expect(logContent).toContain('TEST_CATEGORY');
      expect(logContent).toContain('Test message');
      expect(logContent).toContain('key');
      expect(logContent).toContain('value');
      expect(logContent).toContain('42');
    });
  });

  describe('日志级别管理', () => {
    it('应该正确设置和获取日志级别', () => {
      expect(logger.getLevel()).toBe(LogLevel.DEBUG); // We set DEBUG in beforeEach

      logger.setLevel(LogLevel.ERROR);
      expect(logger.getLevel()).toBe(LogLevel.ERROR);

      logger.setLevel(LogLevel.INFO);
      expect(logger.getLevel()).toBe(LogLevel.INFO);
    });

    it('应该在SILENT级别时不记录任何日志', async () => {
      logger.setLevel(LogLevel.SILENT);

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      await logger.flush();

      const logFiles = await fs.readdir(testLogDir);
      if (logFiles.length > 0) {
        const logContent = await fs.readFile(path.join(testLogDir, logFiles[0]), 'utf8');
        expect(logContent.trim()).toBe('');
      }
    });
  });

  describe('文件日志管理', () => {
    it('应该创建日志文件', async () => {
      logger.info('Test message');
      await logger.flush();

      const logFiles = await fs.readdir(testLogDir);
      expect(logFiles.length).toBeGreaterThan(0);
      expect(logFiles[0]).toMatch(/^web-to-apk-.*\.log$/);
    });

    it('应该清理旧日志文件', async () => {
      // Create logger with small max files limit
      const cleanupLogger = new WebToAPKLogger({
        logDirectory: testLogDir,
        enableConsoleLogging: false,
        maxLogFiles: 2,
        maxLogFileSize: 100 // Very small size to force rotation
      });

      // Write enough logs to trigger rotation
      for (let i = 0; i < 10; i++) {
        cleanupLogger.info(`Message ${i}`.repeat(20)); // Make messages longer
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      }

      await cleanupLogger.cleanup();
      await cleanupLogger.flush();

      const logFiles = await fs.readdir(testLogDir);
      expect(logFiles.length).toBeLessThanOrEqual(2);
    });
  });

  describe('单例模式', () => {
    it('应该返回相同的默认logger实例', () => {
      const logger1 = getLogger();
      const logger2 = getLogger();
      expect(logger1).toBe(logger2);
    });

    it('应该允许设置自定义logger', () => {
      const customLogger = new WebToAPKLogger();
      setLogger(customLogger);
      
      const retrievedLogger = getLogger();
      expect(retrievedLogger).toBe(customLogger);
    });
  });

  describe('错误处理', () => {
    it('应该处理写入错误而不崩溃', async () => {
      // Create logger with invalid directory
      const invalidLogger = new WebToAPKLogger({
        logDirectory: '/invalid/path/that/does/not/exist',
        enableConsoleLogging: false,
        enableFileLogging: true
      });

      // This should not throw
      expect(() => {
        invalidLogger.info('Test message');
      }).not.toThrow();

      await invalidLogger.flush();
    });
  });
});