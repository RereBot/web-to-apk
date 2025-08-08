#!/usr/bin/env node
/**
 * Web-to-APK CLI
 * Command line interface for converting web applications to Android APK files
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { buildCommand } from './commands/build.js';
import { serveCommand } from './commands/serve.js';
import { helpCommand } from './commands/help.js';
import { versionCommand } from './commands/version.js';
const program = new Command();
// CLI 程序信息
program.name('web-to-apk').description('将网页应用转换为Android APK文件').version('1.0.0');
// 添加全局选项
program.option('-v, --verbose', '显示详细输出').option('--no-color', '禁用彩色输出');
// 注册命令
program.addCommand(initCommand);
program.addCommand(buildCommand);
program.addCommand(serveCommand);
program.addCommand(helpCommand);
program.addCommand(versionCommand);
// 显示帮助信息当没有参数时
if (process.argv.length <= 2) {
    program.help();
}
// 错误处理
program.exitOverride();
async function main() {
    try {
        await program.parseAsync(process.argv);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(chalk.red('错误:'), error.message);
            process.exit(1);
        }
    }
}
// 直接执行main函数
main();
//# sourceMappingURL=index.js.map