/**
 * Build命令实现
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createCLI } from '../CLIFactory.js';
import { validateConfigFile, validateKeystoreFile } from '../validators.js';
import type { BuildOptions } from '../../interfaces/CLI.js';

export const buildCommand = new Command('build')
  .description('Build Android APK file')
  .argument('[config-path]', 'Configuration file path', './web-to-apk.config.json')
  .option('-o, --output <path>', 'Output directory', './dist')
  .option('-r, --release', 'Build release version', false)
  .option('--keystore <path>', 'Keystore file path')
  .option('--keystore-password <password>', 'Keystore password')
  .option('--key-alias <alias>', 'Key alias')
  .option('--key-password <password>', 'Key password')
  .option('--minify', 'Minify web resources', false)
  .option('--clean', 'Clean output directory before build')
  .option('--skip-validation', 'Skip configuration validation')
  .option('--verbose', 'Show verbose build logs')
  .option('--target <target>', 'Target Android API level')
  .option('--arch <arch>', 'Target architecture (arm64-v8a, armeabi-v7a, x86_64)', 'arm64-v8a')
  .action(async (configPath: string, options: BuildOptions) => {
    const startTime = Date.now();

    try {
      // Display build start information
      console.log(chalk.blue.bold('\nWeb-to-APK Build Tool'));
      console.log(chalk.gray(`Configuration file: ${configPath}`));
      console.log(chalk.gray(`Start time: ${new Date().toLocaleString()}\n`));

      // Validate configuration file (unless skipped)
      if (!options.skipValidation) {
        const configValidation = await validateConfigFile(configPath);
        if (!configValidation.valid) {
          console.error(chalk.red('Configuration file validation failed:'), configValidation.error);
          console.error(chalk.yellow('Tip: Use --skip-validation to skip validation (not recommended)'));
          process.exit(1);
        }
      }

      // Validate build environment
      await validateBuildEnvironment();

      // Validate keystore file (if provided)
      if (options.keystore) {
        const keystoreValidation = await validateKeystoreFile(options.keystore);
        if (!keystoreValidation.valid) {
          console.error(chalk.red('Keystore file validation failed:'), keystoreValidation.error);
          process.exit(1);
        }

        // Check required signing parameters
        if (!options.keystorePassword) {
          console.error(chalk.red('Keystore password is required when using keystore (--keystore-password)'));
          process.exit(1);
        }

        if (!options.keyAlias) {
          console.error(chalk.red('Key alias is required when using keystore (--key-alias)'));
          process.exit(1);
        }
      }

      // Validate output directory
      if (options.output) {
        await validateOutputDirectory(options.output);
      }

      // Set verbose logging
      if (options.verbose) {
        process.env.VERBOSE = 'true';
      }

      // Execute build
      const cli = createCLI();
      await cli.build(configPath, options);

      // Display build completion information
      const totalTime = Date.now() - startTime;
      console.log(chalk.green.bold('\nBuild completed successfully!'));
      console.log(chalk.gray(`Total time: ${(totalTime / 1000).toFixed(2)} seconds`));
      console.log(chalk.gray(`Completion time: ${new Date().toLocaleString()}\n`));
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(chalk.red.bold('\n💥 Build Failed!'));
      console.error(chalk.red('Error message:'), error instanceof Error ? error.message : error);
      console.error(chalk.gray(`Failed after: ${(totalTime / 1000).toFixed(2)} seconds\n`));

      // Display troubleshooting information
      displayTroubleshootingInfo(error);

      process.exit(1);
    }
  });

/**
 * Validate build environment
 */
async function validateBuildEnvironment(): Promise<void> {
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion < 16) {
    console.warn(chalk.yellow('Warning: Node.js 16 or higher is recommended'));
  }

  // Check available memory
  const totalMemory = process.memoryUsage();
  if (totalMemory.heapTotal < 100 * 1024 * 1024) {
    // 100MB
    console.warn(chalk.yellow('Warning: Low available memory, build may be slow'));
  }
}

/**
 * Validate output directory
 */
async function validateOutputDirectory(outputDir: string): Promise<void> {
  try {
    const { validateDirectoryPath } = await import('../validators.js');
    const pathModule = await import('path');
    const parentDir = pathModule.dirname(outputDir);
    const parentExists = await validateDirectoryPath(parentDir);

    if (!parentExists) {
      console.error(chalk.red(`Output directory parent does not exist: ${parentDir}`));
      process.exit(1);
    }
  } catch (error) {
    console.warn(
      chalk.yellow(`Unable to validate output directory: ${error instanceof Error ? error.message : error}`)
    );
  }
}

/**
 * Display troubleshooting information
 */
function displayTroubleshootingInfo(error: unknown): void {
  console.error(chalk.yellow('\nTroubleshooting suggestions:'));

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('android sdk')) {
      console.error('  • Ensure Android SDK is properly installed');
      console.error('  • Set ANDROID_HOME environment variable');
      console.error('  • Add SDK tools to PATH');
    } else if (message.includes('gradle')) {
      console.error('  • Check Gradle configuration');
      console.error('  • Clean Gradle cache: ./gradlew clean');
      console.error('  • Check network connection');
    } else if (message.includes('keystore')) {
      console.error('  • Verify keystore file path');
      console.error('  • Check keystore password and alias');
      console.error('  • Ensure keystore file format is correct');
    } else if (message.includes('permission')) {
      console.error('  • Check file and directory permissions');
      console.error('  • Ensure write access to output directory');
    } else {
      console.error('  • Check configuration file format');
      console.error('  • Ensure all dependencies are installed');
      console.error('  • Try using --verbose for detailed logs');
      console.error('  • Use --clean to clear build cache');
    }
  }

  console.error(chalk.gray('\nMore help:'));
  console.error('  • View documentation: web-to-apk help build');
  console.error('  • Report issues: https://github.com/your-repo/issues');
}

// Add help information
buildCommand.addHelpText(
  'after',
  `
Examples:
  $ web-to-apk build
  $ web-to-apk build --release --keystore ./my-key.keystore
  $ web-to-apk build ./custom-config.json --output ./build --clean
  $ web-to-apk build --verbose --target 30 --arch arm64-v8a

Build options:
  --release         Build release version (requires signing)
  --clean           Clean output directory before build
  --minify          Minify web resources to reduce APK size
  --verbose         Show detailed build logs
  --skip-validation Skip configuration validation (not recommended)
  --target          Specify target Android API level
  --arch            Specify target architecture

Signing options:
  --keystore        Keystore file path
  --keystore-password Keystore password
  --key-alias       Key alias
  --key-password    Key password

Troubleshooting:
  If build fails, check:
  1. Android SDK is properly installed
  2. Configuration file format is correct
  3. Network connection is available
  4. Sufficient disk space is available
`
);
