/**
 * Help命令实现
 */
import { Command } from 'commander';
import chalk from 'chalk';
export const helpCommand = new Command('help')
    .description('显示详细帮助信息')
    .argument('[command]', '显示特定命令的帮助')
    .action((command) => {
    if (command) {
        // 显示特定命令的详细帮助
        showCommandHelp(command);
    }
    else {
        // 显示总体帮助信息
        showGeneralHelp();
    }
});
function showGeneralHelp() {
    console.log(chalk.blue.bold('\n📱 Web-to-APK 工具'));
    console.log(chalk.gray('将网页应用转换为Android APK文件\n'));
    console.log(chalk.yellow.bold('使用方法:'));
    console.log('  web-to-apk <command> [options]\n');
    console.log(chalk.yellow.bold('可用命令:'));
    console.log('  init     初始化新的Web-to-APK项目');
    console.log('  build    构建Android APK文件');
    console.log('  serve    启动开发服务器预览应用');
    console.log('  help     显示帮助信息\n');
    console.log(chalk.yellow.bold('全局选项:'));
    console.log('  -v, --verbose    显示详细输出');
    console.log('  --no-color       禁用彩色输出');
    console.log('  --version        显示版本信息\n');
    console.log(chalk.yellow.bold('示例:'));
    console.log('  web-to-apk init my-app');
    console.log('  web-to-apk build --release');
    console.log('  web-to-apk serve --port 8080\n');
    console.log(chalk.gray('获取特定命令的帮助: web-to-apk help <command>'));
}
function showCommandHelp(command) {
    switch (command) {
        case 'init':
            showInitHelp();
            break;
        case 'build':
            showBuildHelp();
            break;
        case 'serve':
            showServeHelp();
            break;
        default:
            console.log(chalk.red(`未知命令: ${command}`));
            console.log(chalk.gray('可用命令: init, build, serve'));
    }
}
function showInitHelp() {
    console.log(chalk.blue.bold('\n🚀 init 命令'));
    console.log(chalk.gray('初始化新的Web-to-APK项目\n'));
    console.log(chalk.yellow.bold('使用方法:'));
    console.log('  web-to-apk init [project-path] [options]\n');
    console.log(chalk.yellow.bold('参数:'));
    console.log('  project-path     项目目录路径 (默认: 当前目录)\n');
    console.log(chalk.yellow.bold('选项:'));
    console.log('  -n, --name <name>              应用名称');
    console.log('  -p, --package-name <package>   包名 (如: com.example.app)');
    console.log('  -t, --template <template>      项目模板 (默认: basic)');
    console.log('  -i, --interactive              交互式配置 (默认)');
    console.log('  --no-interactive               非交互式配置');
    console.log('  --force                        强制覆盖已存在的项目\n');
    console.log(chalk.yellow.bold('示例:'));
    console.log('  web-to-apk init my-app');
    console.log('  web-to-apk init --name "我的应用" --package-name com.example.myapp');
    console.log('  web-to-apk init --no-interactive --force');
}
function showBuildHelp() {
    console.log(chalk.blue.bold('\n🔨 build 命令'));
    console.log(chalk.gray('构建Android APK文件\n'));
    console.log(chalk.yellow.bold('使用方法:'));
    console.log('  web-to-apk build [config-path] [options]\n');
    console.log(chalk.yellow.bold('参数:'));
    console.log('  config-path      配置文件路径 (默认: ./web-to-apk.config.json)\n');
    console.log(chalk.yellow.bold('选项:'));
    console.log('  -o, --output <path>                输出目录 (默认: ./dist)');
    console.log('  -r, --release                      构建发布版本');
    console.log('  --keystore <path>                  密钥库文件路径');
    console.log('  --keystore-password <password>     密钥库密码');
    console.log('  --key-alias <alias>                密钥别名');
    console.log('  --key-password <password>          密钥密码');
    console.log('  --minify                           压缩Web资源');
    console.log('  --clean                            构建前清理输出目录\n');
    console.log(chalk.yellow.bold('示例:'));
    console.log('  web-to-apk build');
    console.log('  web-to-apk build --release --keystore ./my-key.keystore');
    console.log('  web-to-apk build ./custom-config.json --output ./build --clean');
}
function showServeHelp() {
    console.log(chalk.blue.bold('\n🌐 serve 命令'));
    console.log(chalk.gray('启动开发服务器预览应用\n'));
    console.log(chalk.yellow.bold('使用方法:'));
    console.log('  web-to-apk serve [options]\n');
    console.log(chalk.yellow.bold('选项:'));
    console.log('  -p, --port <port>    端口号 (默认: 3000)');
    console.log('  -h, --host <host>    主机地址 (默认: localhost)');
    console.log('  --open               自动打开浏览器');
    console.log('  --https              使用HTTPS协议\n');
    console.log(chalk.yellow.bold('示例:'));
    console.log('  web-to-apk serve');
    console.log('  web-to-apk serve --port 8080 --open');
    console.log('  web-to-apk serve --host 0.0.0.0 --https');
}
//# sourceMappingURL=help.js.map