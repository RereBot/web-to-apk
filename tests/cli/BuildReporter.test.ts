/**
 * BuildReporter 单元测试
 */

import { BuildReporter } from '../../src/cli/BuildReporter.js';
import type { AppConfig } from '../../src/types/index.js';
import type { BuildOptions } from '../../src/interfaces/CLI.js';

describe('BuildReporter', () => {
  let reporter: BuildReporter;
  let testConfig: Partial<AppConfig>;
  let testOptions: BuildOptions;

  beforeEach(() => {
    testConfig = {
      appName: 'Test App',
      packageName: 'com.test.app',
      version: '1.0.0',
      webDir: './dist',
      startUrl: 'index.html'
    };

    testOptions = {
      output: './build',
      release: false,
      minify: false,
      clean: true
    };

    reporter = new BuildReporter(testConfig, testOptions);

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Step Management', () => {
    it('应该正确开始构建步骤', () => {
      reporter.startStep('testStep');
      
      const report = reporter.getReport();
      expect(report.steps).toHaveLength(1);
      expect(report.steps[0].name).toBe('testStep');
      expect(report.steps[0].success).toBe(false);
      expect(report.steps[0].endTime).toBeUndefined();
    });

    it('应该正确完成构建步骤', () => {
      reporter.startStep('testStep');
      reporter.completeStep('testStep', true);
      
      const report = reporter.getReport();
      expect(report.steps[0].success).toBe(true);
      expect(report.steps[0].endTime).toBeDefined();
    });

    it('应该正确处理步骤错误', () => {
      reporter.startStep('testStep');
      reporter.completeStep('testStep', false, 'Test error');
      
      const report = reporter.getReport();
      expect(report.steps[0].success).toBe(false);
      expect(report.steps[0].error).toBe('Test error');
    });

    it('应该支持多个构建步骤', () => {
      const steps = ['step1', 'step2', 'step3'];
      
      steps.forEach(step => {
        reporter.startStep(step);
        reporter.completeStep(step, true);
      });
      
      const report = reporter.getReport();
      expect(report.steps).toHaveLength(3);
      expect(report.steps.every(step => step.success)).toBe(true);
    });

    it('应该只完成最近开始的同名步骤', () => {
      reporter.startStep('testStep');
      reporter.startStep('testStep'); // 同名步骤
      reporter.completeStep('testStep', true);
      
      const report = reporter.getReport();
      expect(report.steps).toHaveLength(2);
      expect(report.steps[0].endTime).toBeUndefined(); // 第一个步骤未完成
      expect(report.steps[1].endTime).toBeDefined(); // 第二个步骤已完成
    });
  });

  describe('Build Completion', () => {
    it('应该正确完成成功的构建', () => {
      const apkPath = '/test/app.apk';
      const apkSize = 1024 * 1024 * 5; // 5MB
      
      reporter.completeBuild(true, apkPath, apkSize);
      
      const report = reporter.getReport();
      expect(report.success).toBe(true);
      expect(report.apkPath).toBe(apkPath);
      expect(report.apkSize).toBe(apkSize);
      expect(report.endTime).toBeDefined();
    });

    it('应该正确完成失败的构建', () => {
      const error = new Error('Build failed');
      
      reporter.completeBuild(false, undefined, undefined, error);
      
      const report = reporter.getReport();
      expect(report.success).toBe(false);
      expect(report.error).toBe(error);
      expect(report.apkPath).toBeUndefined();
      expect(report.apkSize).toBeUndefined();
    });
  });

  describe('Report Generation', () => {
    it('应该生成完整的构建报告', () => {
      reporter.startStep('step1');
      reporter.completeStep('step1', true);
      reporter.completeBuild(true, '/test/app.apk', 1024 * 1024);
      
      const report = reporter.getReport();
      
      expect(report.config).toEqual(testConfig);
      expect(report.options).toEqual(testOptions);
      expect(report.steps).toHaveLength(1);
      expect(report.success).toBe(true);
      expect(report.startTime).toBeDefined();
      expect(report.endTime).toBeDefined();
    });

    it('应该正确导出JSON格式报告', () => {
      reporter.completeBuild(true, '/test/app.apk');
      
      const jsonReport = reporter.exportToJSON();
      const parsedReport = JSON.parse(jsonReport);
      
      expect(parsedReport.config).toEqual(testConfig);
      expect(parsedReport.options).toEqual(testOptions);
      expect(parsedReport.success).toBe(true);
    });
  });

  describe('Display Methods', () => {
    beforeEach(() => {
      // Setup a complete build scenario
      reporter.startStep('loadConfig');
      reporter.completeStep('loadConfig', true);
      reporter.startStep('buildAPK');
      reporter.completeStep('buildAPK', true);
      reporter.completeBuild(true, '/test/app.apk', 1024 * 1024 * 5);
    });

    it('应该显示构建摘要', () => {
      reporter.displaySummary();
      
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('构建摘要'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Test App'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('com.test.app'));
    });

    it('应该显示详细报告', () => {
      reporter.displayDetailedReport();
      
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('构建摘要'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('详细信息'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('配置信息'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('性能统计'));
    });

    it('应该显示优化建议', () => {
      reporter.displayRecommendations();
      
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('优化建议'));
    });
  });

  describe('Performance Analysis', () => {
    it('应该正确计算步骤耗时', () => {
      reporter.startStep('testStep');
      reporter.completeStep('testStep', true);
      
      const report = reporter.getReport();
      const step = report.steps[0];
      const stepDuration = step.endTime! - step.startTime;
      
      expect(stepDuration).toBeGreaterThanOrEqual(0);
    });

    it('应该正确计算总构建时间', async () => {
      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      reporter.completeBuild(true);
      
      const report = reporter.getReport();
      const totalTime = report.endTime! - report.startTime;
      
      expect(totalTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Scenarios', () => {
    it('应该处理构建失败场景', () => {
      const error = new Error('Build failed');
      
      reporter.startStep('buildAPK');
      reporter.completeStep('buildAPK', false, 'APK build failed');
      reporter.completeBuild(false, undefined, undefined, error);
      
      const report = reporter.getReport();
      expect(report.success).toBe(false);
      expect(report.error).toBe(error);
      expect(report.steps[0].success).toBe(false);
      expect(report.steps[0].error).toBe('APK build failed');
    });

    it('应该处理部分步骤失败场景', () => {
      reporter.startStep('step1');
      reporter.completeStep('step1', true);
      
      reporter.startStep('step2');
      reporter.completeStep('step2', false, 'Step 2 failed');
      
      reporter.startStep('step3');
      reporter.completeStep('step3', true);
      
      const report = reporter.getReport();
      expect(report.steps).toHaveLength(3);
      expect(report.steps[0].success).toBe(true);
      expect(report.steps[1].success).toBe(false);
      expect(report.steps[2].success).toBe(true);
    });
  });

  describe('Configuration Handling', () => {
    it('应该正确处理包含资源的配置', () => {
      const configWithResources: Partial<AppConfig> = {
        ...testConfig,
        icon: './assets/icon.png',
        splashScreen: './assets/splash.png',
        permissions: ['android.permission.INTERNET']
      };
      
      const reporterWithResources = new BuildReporter(configWithResources, testOptions);
      reporterWithResources.completeBuild(true);
      
      const report = reporterWithResources.getReport();
      expect(report.config.icon).toBe('./assets/icon.png');
      expect(report.config.splashScreen).toBe('./assets/splash.png');
      expect(report.config.permissions).toContain('android.permission.INTERNET');
    });

    it('应该正确处理发布构建选项', () => {
      const releaseOptions: BuildOptions = {
        ...testOptions,
        release: true,
        keystore: './test.keystore',
        keyAlias: 'test',
        minify: true
      };
      
      const releaseReporter = new BuildReporter(testConfig, releaseOptions);
      releaseReporter.completeBuild(true);
      
      const report = releaseReporter.getReport();
      expect(report.options.release).toBe(true);
      expect(report.options.keystore).toBe('./test.keystore');
      expect(report.options.minify).toBe(true);
    });
  });
});