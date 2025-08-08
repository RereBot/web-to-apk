#!/usr/bin/env node

/**
 * Comprehensive build and validation script
 * Performs all necessary checks and builds for the project
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

class BuildValidator {
  constructor() {
    this.steps = [
      { name: 'Clean previous build', command: 'npm', args: ['run', 'clean'] },
      { name: 'Fix import paths', command: 'npm', args: ['run', 'fix-imports'] },
      { name: 'Format code', command: 'npm', args: ['run', 'format'] },
      { name: 'Lint code', command: 'npm', args: ['run', 'lint:fix'] },
      { name: 'Run integration check', command: 'npm', args: ['run', 'integration-check'] },
      { name: 'Build TypeScript', command: 'npm', args: ['run', 'build'] },
      { name: 'Run tests', command: 'npm', args: ['test'] },
      { name: 'Validate examples', command: 'node', args: ['scripts/validate-examples.js'] }
    ];
  }

  async run() {
    console.log('🚀 Starting comprehensive build and validation...\n');

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      console.log(`📋 Step ${i + 1}/${this.steps.length}: ${step.name}`);

      try {
        await this.runCommand(step.command, step.args);
        console.log(`✅ ${step.name} completed successfully\n`);
      } catch (error) {
        console.error(`❌ ${step.name} failed:`, error.message);
        process.exit(1);
      }
    }

    console.log('🎉 All validation steps completed successfully!');
    await this.generateReport();
  }

  async runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        cwd: rootDir,
        stdio: 'inherit',
        shell: true
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  async generateReport() {
    console.log('\n📊 Generating build report...');

    const report = {
      timestamp: new Date().toISOString(),
      status: 'success',
      steps: this.steps.map(step => ({ name: step.name, status: 'completed' })),
      fileStats: await this.getFileStats(),
      packageInfo: await this.getPackageInfo()
    };

    const reportPath = path.join(rootDir, 'build-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`📄 Build report saved to: ${reportPath}`);
  }

  async getFileStats() {
    const libDir = path.join(rootDir, 'lib');
    const srcDir = path.join(rootDir, 'src');

    const stats = {
      sourceFiles: 0,
      builtFiles: 0,
      testFiles: 0
    };

    try {
      stats.sourceFiles = await this.countFiles(srcDir, '.ts');
      stats.builtFiles = await this.countFiles(libDir, '.js');
      stats.testFiles = await this.countFiles(path.join(rootDir, 'tests'), '.test.ts');
    } catch (error) {
      console.warn('Could not gather file statistics:', error.message);
    }

    return stats;
  }

  async countFiles(dir, extension) {
    let count = 0;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          count += await this.countFiles(fullPath, extension);
        } else if (entry.isFile() && entry.name.endsWith(extension)) {
          count++;
        }
      }
    } catch (error) {
      // Directory might not exist, return 0
    }

    return count;
  }

  async getPackageInfo() {
    try {
      const packagePath = path.join(rootDir, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);

      return {
        name: packageJson.name,
        version: packageJson.version,
        dependencies: Object.keys(packageJson.dependencies || {}).length,
        devDependencies: Object.keys(packageJson.devDependencies || {}).length
      };
    } catch (error) {
      return { error: 'Could not read package.json' };
    }
  }
}

async function main() {
  const validator = new BuildValidator();
  await validator.run();
}

main().catch(console.error);