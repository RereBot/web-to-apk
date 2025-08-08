/**
 * Serve命令实现
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createCLI } from '../CLIFactory.js';
import { validatePort } from '../validators.js';
import type { ServeOptions } from '../../interfaces/CLI.js';

export const serveCommand = new Command('serve')
  .description('启动开发服务器预览应用')
  .option('-p, --port <port>', '端口号', '3000')
  .option('-h, --host <host>', '主机地址', 'localhost')
  .option('--open', '自动打开浏览器', false)
  .option('--https', '使用HTTPS协议')
  .action(async (options: ServeOptions) => {
    try {
      // 验证端口号
      if (options.port && !validatePort(options.port)) {
        console.error(chalk.red('❌ 端口号无效: 端口号必须在1-65535之间'));
        process.exit(1);
      }

      console.log(chalk.blue('🌐 启动开发服务器...'));

      const cli = createCLI();
      await cli.serve(options);
    } catch (error) {
      console.error(
        chalk.red('❌ 服务器启动失败:'),
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  });

// 添加帮助信息
serveCommand.addHelpText(
  'after',
  `
示例:
  $ web-to-apk serve
  $ web-to-apk serve --port 8080 --open
  $ web-to-apk serve --host 0.0.0.0 --port 3000
`
);
