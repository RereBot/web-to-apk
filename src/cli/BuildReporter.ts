/**
 * 构建状态报告器
 */

import chalk from 'chalk';
import type { AppConfig } from '../types/index.js';
import type { BuildOptions } from '../interfaces/CLI.js';

export interface BuildReport {
  startTime: number;
  endTime?: number;
  config: Partial<AppConfig>;
  options: BuildOptions;
  steps: BuildStep[];
  success: boolean;
  error?: Error | undefined;
  apkPath?: string | undefined;
  apkSize?: number | undefined;
}

export interface BuildStep {
  name: string;
  startTime: number;
  endTime?: number;
  success: boolean;
  error?: string | undefined;
  details?: any;
}

export class BuildReporter {
  private report: BuildReport;

  constructor(config: Partial<AppConfig>, options: BuildOptions) {
    this.report = {
      startTime: Date.now(),
      config,
      options,
      steps: [],
      success: false
    };
  }

  /**
   * 开始一个构建步骤
   */
  startStep(name: string): void {
    const step: BuildStep = {
      name,
      startTime: Date.now(),
      success: false
    };
    this.report.steps.push(step);
  }

  /**
   * 完成一个构建步骤
   */
  completeStep(
    name: string,
    success: boolean = true,
    error?: string | undefined,
    details?: any
  ): void {
    // Find the last (most recent) step with the given name that hasn't been completed
    const steps = this.report.steps.filter(s => s.name === name && !s.endTime);
    const step = steps[steps.length - 1];
    if (step) {
      step.endTime = Date.now();
      step.success = success;
      if (error !== undefined) {
        step.error = error;
      }
      step.details = details;
    }
  }

  /**
   * 完成构建
   */
  completeBuild(
    success: boolean,
    apkPath?: string | undefined,
    apkSize?: number | undefined,
    error?: Error | undefined
  ): void {
    this.report.endTime = Date.now();
    this.report.success = success;
    if (apkPath !== undefined) {
      this.report.apkPath = apkPath;
    }
    if (apkSize !== undefined) {
      this.report.apkSize = apkSize;
    }
    if (error !== undefined) {
      this.report.error = error;
    }
  }

  /**
   * 获取构建报告
   */
  getReport(): BuildReport {
    return { ...this.report };
  }

  /**
   * 显示构建摘要
   */
  displaySummary(): void {
    const totalTime = this.report.endTime ? this.report.endTime - this.report.startTime : 0;

    console.log(chalk.blue('\n📊 构建摘要'));
    console.log('─'.repeat(50));

    // 基本信息
    console.log(`应用名称: ${this.report.config?.appName || 'N/A'}`);
    console.log(`包名: ${this.report.config?.packageName || 'N/A'}`);
    console.log(`版本: ${this.report.config?.version || 'N/A'}`);
    console.log(`构建类型: ${this.report.options.release ? '发布版本' : '调试版本'}`);

    // 构建结果
    if (this.report.success) {
      console.log(chalk.green('状态: ✅ 成功'));
      if (this.report.apkPath) {
        console.log(`APK文件: ${this.report.apkPath}`);
      }
      if (this.report.apkSize) {
        console.log(`文件大小: ${(this.report.apkSize / (1024 * 1024)).toFixed(2)} MB`);
      }
    } else {
      console.log(chalk.red('状态: ❌ 失败'));
      if (this.report.error) {
        console.log(chalk.red(`错误: ${this.report.error.message}`));
      }
    }

    console.log(`总耗时: ${(totalTime / 1000).toFixed(2)}秒`);

    // 步骤详情
    console.log(chalk.blue('\n📋 构建步骤'));
    console.log('─'.repeat(50));

    this.report.steps.forEach((step, index) => {
      const stepTime = step.endTime ? step.endTime - step.startTime : 0;
      const status = step.success ? chalk.green('✅') : chalk.red('❌');
      const duration = step.endTime ? `${(stepTime / 1000).toFixed(2)}s` : '进行中...';

      console.log(`${index + 1}. ${status} ${step.name} (${duration})`);

      if (!step.success && step.error) {
        console.log(chalk.red(`   错误: ${step.error}`));
      }
    });

    console.log('─'.repeat(50));
  }

  /**
   * 显示详细报告
   */
  displayDetailedReport(): void {
    this.displaySummary();

    console.log(chalk.blue('\n🔍 详细信息'));
    console.log('─'.repeat(50));

    // 配置详情
    console.log(chalk.yellow('配置信息:'));
    console.log(`  Web目录: ${this.report.config.webDir || 'N/A'}`);
    console.log(`  启动页面: ${this.report.config.startUrl || 'N/A'}`);
    console.log(`  屏幕方向: ${this.report.config.orientation || 'N/A'}`);

    if (this.report.config.icon) {
      console.log(`  应用图标: ${this.report.config.icon}`);
    }

    if (this.report.config.splashScreen) {
      console.log(`  启动画面: ${this.report.config.splashScreen}`);
    }

    if (this.report.config.permissions && this.report.config.permissions.length > 0) {
      console.log(`  权限: ${this.report.config.permissions.join(', ')}`);
    }

    // 构建选项详情
    console.log(chalk.yellow('\n构建选项:'));
    console.log(`  输出目录: ${this.report.options.output || './dist'}`);
    console.log(`  资源压缩: ${this.report.options.minify ? '启用' : '禁用'}`);
    console.log(`  清理构建: ${this.report.options.clean ? '启用' : '禁用'}`);

    if (this.report.options.keystore) {
      console.log(`  密钥库: ${this.report.options.keystore}`);
      console.log(`  密钥别名: ${this.report.options.keyAlias || 'N/A'}`);
    }

    // 性能统计
    console.log(chalk.yellow('\n性能统计:'));
    const totalTime = this.report.endTime ? this.report.endTime - this.report.startTime : 0;

    this.report.steps.forEach(step => {
      if (step.endTime) {
        const stepTime = step.endTime - step.startTime;
        const percentage = totalTime > 0 ? ((stepTime / totalTime) * 100).toFixed(1) : '0';
        console.log(`  ${step.name}: ${(stepTime / 1000).toFixed(2)}s (${percentage}%)`);
      }
    });

    console.log('─'.repeat(50));
  }

  /**
   * 导出报告为JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.report, null, 2);
  }

  /**
   * 保存报告到文件
   */
  async saveReport(filePath: string): Promise<void> {
    const fs = await import('fs/promises');
    const reportData = this.exportToJSON();
    await fs.writeFile(filePath, reportData, 'utf-8');
  }

  /**
   * 显示构建建议
   */
  displayRecommendations(): void {
    console.log(chalk.blue('\n💡 优化建议'));
    console.log('─'.repeat(50));

    const totalTime = this.report.endTime ? this.report.endTime - this.report.startTime : 0;

    // 基于构建时间的建议
    if (totalTime > 60000) {
      // 超过1分钟
      console.log('• 构建时间较长，考虑：');
      console.log('  - 使用更快的存储设备（SSD）');
      console.log('  - 增加系统内存');
      console.log('  - 启用Gradle构建缓存');
    }

    // 基于构建类型的建议
    if (!this.report.options.release) {
      console.log('• 这是调试构建，发布时记得：');
      console.log('  - 使用 --release 选项');
      console.log('  - 提供有效的密钥库文件');
      console.log('  - 启用资源压缩 --minify');
    }

    // 基于APK大小的建议
    if (this.report.apkSize && this.report.apkSize > 50 * 1024 * 1024) {
      // 超过50MB
      console.log('• APK文件较大，考虑：');
      console.log('  - 启用资源压缩');
      console.log('  - 优化图片资源');
      console.log('  - 移除未使用的依赖');
    }

    // 基于错误的建议
    if (!this.report.success && this.report.error) {
      const errorMessage = this.report.error.message.toLowerCase();

      if (errorMessage.includes('sdk')) {
        console.log('• SDK相关错误，检查：');
        console.log('  - Android SDK安装路径');
        console.log('  - ANDROID_HOME环境变量');
        console.log('  - SDK工具版本兼容性');
      }

      if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
        console.log('• 内存不足，尝试：');
        console.log('  - 关闭其他应用程序');
        console.log('  - 增加JVM堆内存大小');
        console.log('  - 使用64位JVM');
      }
    }

    console.log('─'.repeat(50));
  }
}
