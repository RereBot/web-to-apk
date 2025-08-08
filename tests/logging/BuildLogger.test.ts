/**
 * 构建日志记录器测试
 */

import { BuildLogger } from '../../src/logging/BuildLogger.js';
import { WebToAPKLogger } from '../../src/logging/Logger.js';
import { LogLevel } from '../../src/interfaces/Logger.js';

describe('BuildLogger', () => {
  let mockLogger: jest.Mocked<WebToAPKLogger>;
  let buildLogger: BuildLogger;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn().mockReturnValue(LogLevel.INFO),
      cleanup: jest.fn(),
      flush: jest.fn()
    } as any;

    buildLogger = new BuildLogger('test-build-123', mockLogger);
  });

  describe('构建生命周期', () => {
    it('应该记录构建开始', () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        '构建开始',
        'BUILD',
        expect.objectContaining({
          buildId: 'test-build-123',
          startTime: expect.any(String)
        })
      );
    });

    it('应该记录构建完成', () => {
      buildLogger.completeBuild(true, { outputPath: '/path/to/output' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('构建成功完成'),
        'BUILD_COMPLETE',
        expect.objectContaining({
          buildId: 'test-build-123',
          success: true,
          totalDuration: expect.any(Number),
          outputPath: '/path/to/output'
        })
      );
    });

    it('应该记录构建失败', () => {
      buildLogger.completeBuild(false, { error: 'Build failed' });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('构建失败'),
        'BUILD_FAILED',
        expect.objectContaining({
          buildId: 'test-build-123',
          success: false,
          totalDuration: expect.any(Number),
          error: 'Build failed'
        })
      );
    });
  });

  describe('构建步骤管理', () => {
    it('应该记录步骤开始', () => {
      buildLogger.startStep('compile', { files: 10 });

      expect(mockLogger.info).toHaveBeenCalledWith(
        '开始步骤: compile',
        'BUILD_STEP',
        expect.objectContaining({
          buildId: 'test-build-123',
          stepName: 'compile',
          startTime: expect.any(String),
          files: 10
        })
      );
    });

    it('应该记录步骤完成', () => {
      buildLogger.startStep('compile');
      buildLogger.completeStep('compile', { outputSize: 1024 });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('完成步骤: compile'),
        'BUILD_STEP',
        expect.objectContaining({
          buildId: 'test-build-123',
          stepName: 'compile',
          duration: expect.any(Number),
          outputSize: 1024
        })
      );
    });

    it('应该记录步骤失败', () => {
      const error = new Error('Compilation failed');
      buildLogger.startStep('compile');
      buildLogger.failStep('compile', error, { exitCode: 1 });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('步骤失败: compile'),
        'BUILD_STEP',
        expect.objectContaining({
          buildId: 'test-build-123',
          stepName: 'compile',
          duration: expect.any(Number),
          error: 'Compilation failed',
          stack: expect.any(String),
          exitCode: 1
        })
      );
    });

    it('应该处理未知步骤的完成', () => {
      buildLogger.completeStep('unknown-step');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        '尝试完成未知步骤: unknown-step',
        'BUILD_STEP'
      );
    });

    it('应该处理未知步骤的失败', () => {
      const error = new Error('Test error');
      buildLogger.failStep('unknown-step', error);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        '尝试标记未知步骤失败: unknown-step',
        'BUILD_STEP'
      );
    });
  });

  describe('构建日志记录', () => {
    it('应该记录构建进度', () => {
      buildLogger.logProgress('Processing files...', 50, { currentFile: 'index.js' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Processing files...',
        'BUILD_PROGRESS',
        expect.objectContaining({
          buildId: 'test-build-123',
          progress: 50,
          currentFile: 'index.js'
        })
      );
    });

    it('应该记录构建警告', () => {
      buildLogger.logWarning('Deprecated API used', { api: 'oldFunction' });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Deprecated API used',
        'BUILD_WARNING',
        expect.objectContaining({
          buildId: 'test-build-123',
          api: 'oldFunction'
        })
      );
    });

    it('应该记录构建错误', () => {
      const error = new Error('File not found');
      buildLogger.logError('Failed to read file', error, { filename: 'config.json' });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to read file',
        'BUILD_ERROR',
        expect.objectContaining({
          buildId: 'test-build-123',
          error: 'File not found',
          stack: expect.any(String),
          filename: 'config.json'
        })
      );
    });
  });

  describe('构建摘要', () => {
    it('应该返回构建摘要', () => {
      buildLogger.startStep('step1');
      buildLogger.completeStep('step1');
      buildLogger.startStep('step2');
      buildLogger.failStep('step2', new Error('Test error'));

      const summary = buildLogger.getBuildSummary();

      expect(summary).toEqual({
        buildId: 'test-build-123',
        startTime: expect.any(Date),
        totalDuration: expect.any(Number),
        steps: expect.arrayContaining([
          expect.objectContaining({
            name: 'step1',
            status: 'completed'
          }),
          expect.objectContaining({
            name: 'step2',
            status: 'failed'
          })
        ])
      });
    });
  });

  describe('构建ID生成', () => {
    it('应该生成唯一的构建ID', () => {
      const logger1 = new BuildLogger();
      const logger2 = new BuildLogger();

      const summary1 = logger1.getBuildSummary();
      const summary2 = logger2.getBuildSummary();

      expect(summary1.buildId).not.toBe(summary2.buildId);
      expect(summary1.buildId).toMatch(/^build-\d+-[a-z0-9]+$/);
      expect(summary2.buildId).toMatch(/^build-\d+-[a-z0-9]+$/);
    });
  });
});