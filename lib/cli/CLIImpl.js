/**
 * CLI实现类
 */
import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { BuildReporter } from './BuildReporter.js';
import { ProjectTemplateManager } from './ProjectTemplateManager.js';
export class CLIImpl {
    constructor(configManager, apkBuilder, errorHandler, templateManager) {
        this.configManager = configManager;
        this.apkBuilder = apkBuilder;
        this.errorHandler = errorHandler;
        this.templateManager = templateManager || new ProjectTemplateManager();
    }
    async init(projectPath, options) {
        let spinner = ora('🔍 检查项目目录...').start();
        try {
            // 1. 检查项目目录和冲突
            await this.checkProjectDirectory(projectPath, options.force);
            spinner.succeed('✅ 项目目录检查完成');
            // 2. 获取配置信息
            spinner = ora('⚙️  配置项目...').start();
            let config = {};
            if (options.interactive) {
                spinner.stop();
                config = await this.promptForConfig(options);
                spinner = ora('📝 生成项目文件...').start();
            }
            else {
                config = this.createDefaultConfig(options);
            }
            // 3. 验证模板
            const templateName = options.template || 'basic';
            const template = this.templateManager.getTemplate(templateName);
            if (!template) {
                throw new Error(`模板 "${templateName}" 不存在`);
            }
            spinner.text = '📁 创建项目目录...';
            await fs.mkdir(projectPath, { recursive: true });
            // 4. 应用模板
            spinner.text = '📋 应用项目模板...';
            await this.templateManager.applyTemplate(templateName, projectPath, config);
            // 5. 生成配置文件
            spinner.text = '⚙️  生成配置文件...';
            const configPath = path.join(projectPath, 'web-to-apk.config.json');
            await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
            // 6. 创建资源目录
            spinner.text = '📦 创建资源目录...';
            await this.createResourceDirectories(projectPath);
            // 7. 生成开发文档
            spinner.text = '📚 生成开发文档...';
            await this.generateDevelopmentDocs(projectPath, config, template);
            spinner.succeed('✅ 项目初始化完成');
            // 显示成功信息和下一步指导
            this.displayInitializationSuccess(projectPath, config, template);
        }
        catch (error) {
            spinner.fail('❌ 项目初始化失败');
            throw error;
        }
    }
    async build(configPath, options) {
        let spinner = ora('🔧 加载配置...').start();
        let reporter;
        try {
            // 1. 加载和验证配置
            reporter = new BuildReporter({}, options);
            reporter.startStep('loadConfig');
            const config = await this.configManager.loadConfig(configPath);
            reporter.completeStep('loadConfig', true);
            spinner.succeed('✅ 配置加载完成');
            // 更新报告器的配置信息
            reporter = new BuildReporter(config, options);
            spinner = ora('🔍 验证配置...').start();
            reporter.startStep('validateConfig');
            const validationResult = this.configManager.validateConfig(config);
            if (!validationResult.isValid) {
                reporter.completeStep('validateConfig', false, '配置文件验证失败');
                throw new Error('配置文件验证失败');
            }
            reporter.completeStep('validateConfig', true);
            spinner.succeed('✅ 配置验证通过');
            // 显示构建信息
            this.displayBuildInfo(config, options);
            // 2. Clean output directory (if needed)
            if (options.clean && options.output) {
                spinner = ora('Cleaning output directory...').start();
                reporter.startStep('cleanOutput');
                await this.cleanOutputDirectory(options.output);
                reporter.completeStep('cleanOutput', true);
                spinner.succeed('Output directory cleaned');
            }
            // 3. Initialize Capacitor project
            spinner = ora('🏗️  Initializing Capacitor project...').start();
            reporter.startStep('initializeProject');
            const projectPath = path.dirname(configPath);
            await this.apkBuilder.initializeProject(config, projectPath);
            reporter.completeStep('initializeProject', true);
            spinner.succeed('Capacitor project initialized');
            // 4. Process resource files
            spinner = ora('Processing resource files...').start();
            reporter.startStep('processResources');
            await this.processResources(config, projectPath);
            reporter.completeStep('processResources', true);
            spinner.succeed('Resource files processed');
            // 5. Build APK
            spinner = ora('Building APK...').start();
            reporter.startStep('buildAPK');
            const buildOptions = {
                release: options.release || false,
                outputDir: options.output || './dist',
                minifyWeb: options.minify || false,
                clean: options.clean || false
            };
            const apkPath = await this.apkBuilder.buildAPK(projectPath, buildOptions);
            reporter.completeStep('buildAPK', true, undefined, { apkPath });
            spinner.succeed('APK build completed');
            // 6. Sign APK (if release version)
            let finalApkPath = apkPath;
            if (options.release && options.keystore) {
                spinner = ora('Signing APK...').start();
                reporter.startStep('signAPK');
                const keystoreConfig = {
                    path: options.keystore,
                    password: options.keystorePassword || '',
                    alias: options.keyAlias || '',
                    aliasPassword: options.keyPassword || ''
                };
                finalApkPath = await this.apkBuilder.signAPK(apkPath, keystoreConfig);
                reporter.completeStep('signAPK', true, undefined, { signedApkPath: finalApkPath });
                spinner.succeed('APK signing completed');
            }
            // 7. Get APK file size and complete build report
            const apkSize = await this.getFileSize(finalApkPath);
            reporter.completeBuild(true, finalApkPath, apkSize);
            // 8. Display build results and report
            if (options.verbose) {
                reporter.displayDetailedReport();
                reporter.displayRecommendations();
            }
            else {
                reporter.displaySummary();
            }
        }
        catch (error) {
            spinner.fail('❌ Build Failed');
            if (reporter) {
                reporter.completeBuild(false, undefined, undefined, error);
                if (options.verbose) {
                    reporter.displayDetailedReport();
                }
                else {
                    reporter.displaySummary();
                }
            }
            this.handleBuildError(error);
            throw error;
        }
    }
    async serve(options) {
        const port = parseInt(options.port?.toString() || '3000');
        const host = options.host || 'localhost';
        console.log(chalk.green(`Development server running at: http://${host}:${port}`));
        console.log(chalk.yellow('Press Ctrl+C to stop server'));
        // 这里应该实现实际的服务器逻辑
        // 暂时只是一个占位符实现
        return new Promise(resolve => {
            process.on('SIGINT', () => {
                console.log(chalk.yellow('\nServer stopped'));
                resolve();
            });
        });
    }
    /**
     * 交互式配置提示
     */
    async promptForConfig(options) {
        console.log(chalk.blue('\nProject Configuration Wizard'));
        console.log(chalk.gray('Please fill in the following information to configure your Web-to-APK project:\n'));
        // 1. 基本信息
        const basicAnswers = await inquirer.prompt([
            {
                type: 'input',
                name: 'appName',
                message: '应用名称:',
                default: options.name || 'My Web App',
                validate: (input) => input.trim().length > 0 || '应用名称不能为空'
            },
            {
                type: 'input',
                name: 'packageName',
                message: '包名 (如: com.example.app):',
                default: options.packageName || 'com.example.myapp',
                validate: (input) => {
                    const packageRegex = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
                    return packageRegex.test(input) || '请输入有效的包名格式';
                }
            },
            {
                type: 'input',
                name: 'version',
                message: '版本号:',
                default: '1.0.0',
                validate: (input) => {
                    const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;
                    return versionRegex.test(input) || '请输入有效的版本号格式 (如: 1.0.0)';
                }
            }
        ]);
        // 2. 模板选择（如果没有通过命令行指定）
        let templateName = options.template || 'basic';
        if (!options.template) {
            const templates = this.templateManager.getAvailableTemplates();
            const templateChoices = templates.map(t => ({
                name: `${t.displayName} - ${t.description}`,
                value: t.name
            }));
            const templateAnswer = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'template',
                    message: '选择项目模板:',
                    choices: templateChoices,
                    default: 'basic'
                }
            ]);
            templateName = templateAnswer.template;
        }
        // 3. Web配置
        const webAnswers = await inquirer.prompt([
            {
                type: 'input',
                name: 'webDir',
                message: 'Web文件目录:',
                default: './dist',
                validate: (input) => input.trim().length > 0 || 'Web目录不能为空'
            },
            {
                type: 'input',
                name: 'startUrl',
                message: '启动页面:',
                default: 'index.html'
            }
        ]);
        // 4. 应用配置
        const appAnswers = await inquirer.prompt([
            {
                type: 'list',
                name: 'orientation',
                message: '屏幕方向:',
                choices: [
                    { name: '竖屏 (推荐)', value: 'portrait' },
                    { name: '横屏', value: 'landscape' },
                    { name: '自动旋转', value: 'any' }
                ],
                default: 'portrait'
            }
        ]);
        // 5. 权限配置
        const permissionAnswers = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'permissions',
                message: '选择应用权限:',
                choices: [
                    { name: '网络访问 (必需)', value: 'android.permission.INTERNET', checked: true },
                    {
                        name: '网络状态检测 (推荐)',
                        value: 'android.permission.ACCESS_NETWORK_STATE',
                        checked: true
                    },
                    { name: '相机访问', value: 'android.permission.CAMERA' },
                    { name: '录音权限', value: 'android.permission.RECORD_AUDIO' },
                    { name: '存储访问', value: 'android.permission.WRITE_EXTERNAL_STORAGE' },
                    { name: '位置访问', value: 'android.permission.ACCESS_FINE_LOCATION' },
                    { name: '振动权限', value: 'android.permission.VIBRATE' }
                ],
                validate: (choices) => {
                    return choices.includes('android.permission.INTERNET') || '网络访问权限是必需的';
                }
            }
        ]);
        // 合并所有配置
        const config = {
            ...basicAnswers,
            ...webAnswers,
            ...appAnswers,
            permissions: permissionAnswers.permissions,
            template: templateName
        };
        // Display configuration summary
        console.log(chalk.green('\nConfiguration completed! Project summary:'));
        console.log(chalk.blue('─'.repeat(40)));
        console.log(`App name: ${config.appName}`);
        console.log(`Package name: ${config.packageName}`);
        console.log(`Version: ${config.version}`);
        console.log(`Template: ${templateName}`);
        console.log(`Screen orientation: ${config.orientation}`);
        console.log(`Permissions count: ${config.permissions?.length || 0}`);
        console.log(chalk.blue('─'.repeat(40)));
        return config;
    }
    createDefaultConfig(options) {
        return {
            appName: options.name || 'My Web App',
            packageName: options.packageName || 'com.example.myapp',
            version: '1.0.0',
            webDir: './dist',
            startUrl: 'index.html',
            orientation: 'portrait',
            permissions: ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE']
        };
    }
    /**
     * 检查项目目录
     */
    async checkProjectDirectory(projectPath, force) {
        try {
            const exists = await fs
                .access(projectPath)
                .then(() => true)
                .catch(() => false);
            if (exists) {
                const files = await fs.readdir(projectPath);
                const hasFiles = files.length > 0;
                if (hasFiles && !force) {
                    throw new Error(`目录 "${projectPath}" 不为空。使用 --force 选项强制覆盖。`);
                }
                if (hasFiles && force) {
                    console.log(chalk.yellow(`Warning: Directory "${projectPath}" is not empty, existing files will be overwritten`));
                }
            }
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('不为空')) {
                throw error;
            }
            // 目录不存在是正常的，我们会创建它
        }
    }
    /**
     * 创建资源目录
     */
    async createResourceDirectories(projectPath) {
        const resourceDirs = ['assets/icons', 'assets/splash', 'assets/images'];
        for (const dir of resourceDirs) {
            await fs.mkdir(path.join(projectPath, dir), { recursive: true });
        }
    }
    /**
     * 生成开发文档
     */
    async generateDevelopmentDocs(projectPath, config, template) {
        // 生成开发指南
        const devGuide = this.generateDevelopmentGuide(config, template);
        await fs.writeFile(path.join(projectPath, 'DEVELOPMENT.md'), devGuide, 'utf8');
        // 生成部署指南
        const deployGuide = this.generateDeploymentGuide(config);
        await fs.writeFile(path.join(projectPath, 'DEPLOYMENT.md'), deployGuide, 'utf8');
    }
    /**
     * 显示初始化成功信息
     */
    displayInitializationSuccess(projectPath, config, template) {
        console.log(chalk.green('\nProject initialization successful!'));
        console.log(chalk.blue('\nProject information:'));
        console.log(`  Project path: ${projectPath}`);
        console.log(`  App name: ${config.appName}`);
        console.log(`  Package name: ${config.packageName}`);
        console.log(`  Version: ${config.version}`);
        console.log(`  Template: ${template.displayName}`);
        console.log(chalk.yellow('\nNext steps:'));
        if (projectPath !== '.') {
            console.log(`  cd ${projectPath}`);
        }
        console.log('  # Edit dist/index.html to modify your app');
        console.log('  # Run the following command to build APK:');
        console.log('  web-to-apk build');
        console.log(chalk.gray('\nTips:'));
        console.log('  - Check README.md to understand project structure');
        console.log('  - Check DEVELOPMENT.md for development guide');
        console.log('  - Use web-to-apk serve to start development server');
        console.log('  - Use web-to-apk help to view all commands');
    }
    // Build-related helper methods
    displayBuildInfo(config, options) {
        console.log(chalk.blue('\nBuild information:'));
        console.log(`  App name: ${config.appName || 'N/A'}`);
        console.log(`  Package name: ${config.packageName || 'N/A'}`);
        console.log(`  Version: ${config.version || 'N/A'}`);
        console.log(`  Build type: ${options.release ? 'Release' : 'Debug'}`);
        console.log(`  Output directory: ${options.output || './dist'}`);
        if (options.minify) {
            console.log('  Resource minification: Enabled');
        }
        if (options.clean) {
            console.log('  Clean build: Enabled');
        }
        console.log('');
    }
    async cleanOutputDirectory(outputDir) {
        try {
            const exists = await fs
                .access(outputDir)
                .then(() => true)
                .catch(() => false);
            if (exists) {
                await fs.rm(outputDir, { recursive: true, force: true });
            }
            await fs.mkdir(outputDir, { recursive: true });
        }
        catch (error) {
            console.warn(chalk.yellow(`⚠️  清理输出目录失败: ${error instanceof Error ? error.message : error}`));
        }
    }
    async processResources(config, _projectPath) {
        // 这里可以集成图标处理器和启动画面生成器
        // 暂时只是一个占位符实现
        if (config.icon) {
            console.log(`  Processing app icon: ${config.icon}`);
        }
        if (config.splashScreen) {
            console.log(`  Processing splash screen: ${config.splashScreen}`);
        }
        // 模拟资源处理时间
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    async getFileSize(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return stats.size;
        }
        catch (error) {
            return undefined;
        }
    }
    handleBuildError(error) {
        if (error instanceof Error) {
            console.error(chalk.red('\nBuild error details:'));
            console.error(`  Error message: ${error.message}`);
            // 提供解决建议
            const solution = this.errorHandler.provideSolution(error);
            if (solution) {
                console.error(chalk.yellow(`\n💡 Solution: ${solution}`));
            }
            console.error(chalk.gray('\nTroubleshooting tips:'));
            console.error('  1. Check if Android SDK is properly installed');
            console.error('  2. Ensure all dependencies are installed');
            console.error('  3. Verify configuration file format is correct');
            console.error('  4. Check network connection is available');
        }
    }
    generateDevelopmentGuide(_config, template) {
        return `# 开发指南

## 项目概述

这是一个使用 Web-to-APK 工具创建的 ${template.displayName} 项目。

## 开发环境设置

### 必需工具

1. **Node.js** (版本 16 或更高)
2. **Android SDK** (用于APK构建)
3. **Java JDK** (版本 8 或更高)

## 开发流程

### 1. 修改应用内容

编辑 \`dist/index.html\` 文件来修改应用的界面和功能。

### 2. 本地预览

\`\`\`bash
web-to-apk serve
\`\`\`

### 3. 构建测试

\`\`\`bash
web-to-apk build
\`\`\`

更多详细信息请查看项目文档。
`;
    }
    generateDeploymentGuide(_config) {
        return `# 部署指南

## 发布准备

### 1. 创建签名密钥

\`\`\`bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
\`\`\`

### 2. 构建发布版本

\`\`\`bash
web-to-apk build --release --keystore ./my-release-key.keystore --keystore-password <password> --key-alias my-key-alias --key-password <password> --minify
\`\`\`

更多详细信息请查看项目文档。
`;
    }
}
//# sourceMappingURL=CLIImpl.js.map