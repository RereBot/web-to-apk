/**
 * 日志格式化器测试
 */

import { ConsoleLogFormatter, FileLogFormatter, JSONLogFormatter } from '../../src/logging/LogFormatter.js';
import { LogLevel, LogEntry } from '../../src/interfaces/Logger.js';

describe('LogFormatter', () => {
  const testEntry: LogEntry = {
    timestamp: new Date('2023-01-01T12:00:00.000Z'),
    level: LogLevel.INFO,
    message: 'Test message',
    category: 'TEST',
    metadata: { key: 'value', number: 42 }
  };

  describe('ConsoleLogFormatter', () => {
    it('应该格式化带颜色的控制台日志', () => {
      const formatter = new ConsoleLogFormatter(true, true);
      const result = formatter.format(testEntry);

      expect(result).toContain('2023-01-01T12:00:00.000Z');
      expect(result).toContain('[INFO]');
      expect(result).toContain('[TEST]');
      expect(result).toContain('Test message');
      expect(result).toContain('key');
      expect(result).toContain('value');
    });

    it('应该格式化无颜色的控制台日志', () => {
      const formatter = new ConsoleLogFormatter(false, true);
      const result = formatter.format(testEntry);

      expect(result).toContain('2023-01-01T12:00:00.000Z');
      expect(result).toContain('[INFO]');
      expect(result).toContain('[TEST]');
      expect(result).toContain('Test message');
      // Should not contain ANSI color codes
      expect(result).not.toMatch(/\u001b\[[0-9;]*m/);
    });

    it('应该格式化无时间戳的日志', () => {
      const formatter = new ConsoleLogFormatter(true, false);
      const result = formatter.format(testEntry);

      expect(result).not.toContain('2023-01-01T12:00:00.000Z');
      expect(result).toContain('[INFO]');
      expect(result).toContain('Test message');
    });

    it('应该处理无分类和元数据的日志', () => {
      const simpleEntry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00.000Z'),
        level: LogLevel.ERROR,
        message: 'Simple message'
      };

      const formatter = new ConsoleLogFormatter(true, true);
      const result = formatter.format(simpleEntry);

      expect(result).toContain('2023-01-01T12:00:00.000Z');
      expect(result).toContain('[ERROR]');
      expect(result).toContain('Simple message');
      expect(result).not.toContain('[TEST]'); // Should not contain category
      expect(result).not.toContain('{'); // Should not contain metadata
    });

    it('应该为不同日志级别使用不同颜色', () => {
      // Force chalk to use colors in test environment
      const originalLevel = process.env.FORCE_COLOR;
      process.env.FORCE_COLOR = '1';

      const formatter = new ConsoleLogFormatter(true, false);

      const debugEntry = { ...testEntry, level: LogLevel.DEBUG };
      const infoEntry = { ...testEntry, level: LogLevel.INFO };
      const warnEntry = { ...testEntry, level: LogLevel.WARN };
      const errorEntry = { ...testEntry, level: LogLevel.ERROR };

      const debugResult = formatter.format(debugEntry);
      const infoResult = formatter.format(infoEntry);
      const warnResult = formatter.format(warnEntry);
      const errorResult = formatter.format(errorEntry);

      expect(debugResult).toContain('[DEBUG]');
      expect(infoResult).toContain('[INFO]');
      expect(warnResult).toContain('[WARN]');
      expect(errorResult).toContain('[ERROR]');

      // Restore original environment
      if (originalLevel !== undefined) {
        process.env.FORCE_COLOR = originalLevel;
      } else {
        delete process.env.FORCE_COLOR;
      }
    });
  });

  describe('FileLogFormatter', () => {
    it('应该格式化文件日志', () => {
      const formatter = new FileLogFormatter();
      const result = formatter.format(testEntry);

      expect(result).toBe('2023-01-01T12:00:00.000Z [INFO] [TEST] Test message {"key":"value","number":42}');
    });

    it('应该处理无分类的日志', () => {
      const entryWithoutCategory: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00.000Z'),
        level: LogLevel.WARN,
        message: 'Warning message'
      };

      const formatter = new FileLogFormatter();
      const result = formatter.format(entryWithoutCategory);

      expect(result).toBe('2023-01-01T12:00:00.000Z [WARN]  Warning message');
    });

    it('应该处理无元数据的日志', () => {
      const entryWithoutMetadata: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00.000Z'),
        level: LogLevel.ERROR,
        message: 'Error message',
        category: 'ERROR'
      };

      const formatter = new FileLogFormatter();
      const result = formatter.format(entryWithoutMetadata);

      expect(result).toBe('2023-01-01T12:00:00.000Z [ERROR] [ERROR] Error message');
    });
  });

  describe('JSONLogFormatter', () => {
    it('应该格式化JSON日志', () => {
      const formatter = new JSONLogFormatter();
      const result = formatter.format(testEntry);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({
        timestamp: '2023-01-01T12:00:00.000Z',
        level: LogLevel.INFO,
        levelName: 'INFO',
        category: 'TEST',
        message: 'Test message',
        metadata: { key: 'value', number: 42 }
      });
    });

    it('应该处理无分类和元数据的日志', () => {
      const simpleEntry: LogEntry = {
        timestamp: new Date('2023-01-01T12:00:00.000Z'),
        level: LogLevel.DEBUG,
        message: 'Debug message'
      };

      const formatter = new JSONLogFormatter();
      const result = formatter.format(simpleEntry);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({
        timestamp: '2023-01-01T12:00:00.000Z',
        level: LogLevel.DEBUG,
        levelName: 'DEBUG',
        category: undefined,
        message: 'Debug message',
        metadata: undefined
      });
    });

    it('应该为所有日志级别生成正确的级别名称', () => {
      const formatter = new JSONLogFormatter();

      const levels = [
        { level: LogLevel.DEBUG, name: 'DEBUG' },
        { level: LogLevel.INFO, name: 'INFO' },
        { level: LogLevel.WARN, name: 'WARN' },
        { level: LogLevel.ERROR, name: 'ERROR' },
        { level: LogLevel.SILENT, name: 'SILENT' }
      ];

      levels.forEach(({ level, name }) => {
        const entry = { ...testEntry, level };
        const result = formatter.format(entry);
        const parsed = JSON.parse(result);

        expect(parsed.level).toBe(level);
        expect(parsed.levelName).toBe(name);
      });
    });
  });
});