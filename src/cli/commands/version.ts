/**
 * Version命令实现
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join } from 'path';

export const versionCommand = new Command('version')
  .description('显示版本信息')
  .option('--json', '以JSON格式输出版本信息')
  .action(options => {
    try {
      // 读取package.json获取版本信息
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      const versionInfo = {
        version: packageJson.version,
        name: packageJson.name,
        description: packageJson.description,
        node: process.version,
        platform: process.platform,
        arch: process.arch
      };

      if (options.json) {
        console.log(JSON.stringify(versionInfo, null, 2));
      } else {
        console.log(chalk.blue.bold(`\n📱 ${versionInfo.name}`));
        console.log(chalk.gray(versionInfo.description));
        console.log(chalk.yellow(`\n版本: ${versionInfo.version}`));
        console.log(chalk.gray(`Node.js: ${versionInfo.node}`));
        console.log(chalk.gray(`平台: ${versionInfo.platform} (${versionInfo.arch})\n`));
      }
    } catch (error) {
      console.error(
        chalk.red('❌ 无法读取版本信息:'),
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  });

// 添加帮助信息
versionCommand.addHelpText(
  'after',
  `
示例:
  $ web-to-apk version
  $ web-to-apk version --json
`
);
