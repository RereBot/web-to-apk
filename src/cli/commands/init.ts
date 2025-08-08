/**
 * Init命令实现
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createCLI } from '../CLIFactory.js';
import { ProjectTemplateManager } from '../ProjectTemplateManager.js';
import { validatePackageName, validateAppName } from '../validators.js';
import type { InitOptions } from '../../interfaces/CLI.js';

export const initCommand = new Command('init')
  .description('初始化新的Web-to-APK项目')
  .argument('[project-path]', '项目路径', '.')
  .option('-n, --name <name>', '应用名称')
  .option('-p, --package-name <packageName>', '包名 (如: com.example.app)')
  .option('-t, --template <template>', '项目模板 (basic, react)', 'basic')
  .option('-i, --interactive', '交互式配置', true)
  .option('--no-interactive', '非交互式配置')
  .option('--force', '强制覆盖已存在的项目')
  .option('--list-templates', '显示可用模板列表')
  .action(async (projectPath: string, options: InitOptions) => {
    try {
      // 显示模板列表
      if (options.listTemplates) {
        displayTemplateList();
        return;
      }

      // 参数验证
      if (options.name && !validateAppName(options.name)) {
        console.error(chalk.red('❌ 应用名称无效: 名称不能为空且长度不能超过50个字符'));
        process.exit(1);
      }

      if (options.packageName && !validatePackageName(options.packageName)) {
        console.error(chalk.red('❌ 包名格式无效: 请使用类似 com.example.app 的格式'));
        process.exit(1);
      }

      // 显示初始化开始信息
      console.log(chalk.blue.bold('\n🚀 Web-to-APK 项目初始化'));
      console.log(chalk.gray(`项目路径: ${projectPath}`));
      console.log(chalk.gray(`模板: ${options.template || 'basic'}`));
      console.log(chalk.gray(`交互模式: ${options.interactive ? '启用' : '禁用'}\n`));

      const cli = createCLI();
      await cli.init(projectPath, options);
    } catch (error) {
      console.error(chalk.red('\n❌ 初始化失败:'), error instanceof Error ? error.message : error);

      // 提供故障排除建议
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        console.error(chalk.yellow('\n💡 故障排除建议:'));

        if (message.includes('不为空')) {
          console.error('  • 使用 --force 选项强制覆盖现有文件');
          console.error('  • 选择一个空目录或新目录');
        } else if (message.includes('模板')) {
          console.error('  • 使用 --list-templates 查看可用模板');
          console.error('  • 检查模板名称拼写');
        } else if (message.includes('权限')) {
          console.error('  • 检查目录写入权限');
          console.error('  • 尝试使用管理员权限运行');
        } else {
          console.error('  • 检查网络连接');
          console.error('  • 确保有足够的磁盘空间');
          console.error('  • 使用 --verbose 获取详细错误信息');
        }
      }

      process.exit(1);
    }
  });

/**
 * 显示可用模板列表
 */
function displayTemplateList(): void {
  const templateManager = new ProjectTemplateManager();
  const templates = templateManager.getAvailableTemplates();

  console.log(chalk.blue.bold('\n📋 可用项目模板'));
  console.log('─'.repeat(60));

  templates.forEach(template => {
    console.log(chalk.green(`\n${template.name}`));
    console.log(`  名称: ${template.displayName}`);
    console.log(`  描述: ${template.description}`);

    if (template.dependencies && template.dependencies.length > 0) {
      console.log(`  依赖: ${template.dependencies.join(', ')}`);
    }
  });

  console.log('\n─'.repeat(60));
  console.log(chalk.yellow('使用方法:'));
  console.log('  web-to-apk init my-app --template <template-name>');
  console.log('\n');
}

// 添加帮助信息
initCommand.addHelpText(
  'after',
  `
示例:
  $ web-to-apk init my-app
  $ web-to-apk init --name "我的应用" --package-name com.example.myapp
  $ web-to-apk init --template react --interactive
  $ web-to-apk init --no-interactive --force
  $ web-to-apk init --list-templates

可用模板:
  basic    - 基础HTML模板（默认）
  react    - React单页应用模板

项目结构:
  创建的项目将包含以下文件和目录：
  - dist/           Web应用文件
  - assets/         资源文件（图标、启动画面等）
  - web-to-apk.config.json  配置文件
  - README.md       项目说明
  - DEVELOPMENT.md  开发指南
  - DEPLOYMENT.md   部署指南

配置选项:
  --interactive     启用交互式配置向导（默认）
  --no-interactive  使用默认配置，跳过交互
  --force          强制覆盖已存在的文件
  --template       选择项目模板
`
);
