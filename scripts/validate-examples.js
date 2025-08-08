#!/usr/bin/env node

/**
 * Validate example projects
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const examplesDir = path.join(rootDir, 'examples');

class ExampleValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  async validate() {
    console.log('🔍 Validating example projects...\n');

    try {
      const examples = await fs.readdir(examplesDir, { withFileTypes: true });
      
      for (const example of examples) {
        if (example.isDirectory()) {
          await this.validateExample(example.name);
        }
      }

      this.reportResults();
    } catch (error) {
      console.error('Error validating examples:', error.message);
      process.exit(1);
    }
  }

  async validateExample(exampleName) {
    console.log(`📁 Validating ${exampleName} example...`);

    const examplePath = path.join(examplesDir, exampleName);
    
    // Check required files
    const requiredFiles = [
      'README.md',
      'web-to-apk.config.json',
      'package.json'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(examplePath, file);
      try {
        await fs.access(filePath);
      } catch (error) {
        this.errors.push(`${exampleName}: Missing required file ${file}`);
      }
    }

    // Validate config file
    await this.validateConfig(exampleName, examplePath);

    // Validate package.json
    await this.validatePackageJson(exampleName, examplePath);

    console.log(`✅ ${exampleName} validation completed\n`);
  }

  async validateConfig(exampleName, examplePath) {
    const configPath = path.join(examplePath, 'web-to-apk.config.json');
    
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      // Check required fields
      const requiredFields = ['appName', 'packageName', 'version'];
      for (const field of requiredFields) {
        if (!config[field]) {
          this.errors.push(`${exampleName}: Missing required config field: ${field}`);
        }
      }

      // Validate package name format
      if (config.packageName && !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(config.packageName)) {
        this.errors.push(`${exampleName}: Invalid package name format`);
      }

      // Validate version format
      if (config.version && !/^\d+\.\d+\.\d+$/.test(config.version)) {
        this.errors.push(`${exampleName}: Invalid version format`);
      }

    } catch (error) {
      this.errors.push(`${exampleName}: Invalid config file: ${error.message}`);
    }
  }

  async validatePackageJson(exampleName, examplePath) {
    const packagePath = path.join(examplePath, 'package.json');
    
    try {
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);

      // Check required fields
      if (!packageJson.name) {
        this.errors.push(`${exampleName}: Missing package name`);
      }

      if (!packageJson.version) {
        this.errors.push(`${exampleName}: Missing package version`);
      }

      // Check for web-to-apk dependency
      const hasWebToApk = 
        (packageJson.dependencies && packageJson.dependencies['web-to-apk']) ||
        (packageJson.devDependencies && packageJson.devDependencies['web-to-apk']);

      if (!hasWebToApk) {
        this.warnings.push(`${exampleName}: Missing web-to-apk dependency`);
      }

    } catch (error) {
      this.errors.push(`${exampleName}: Invalid package.json: ${error.message}`);
    }
  }

  reportResults() {
    console.log('📊 Example Validation Results');
    console.log('=' .repeat(40));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All examples are valid!');
    } else {
      if (this.errors.length > 0) {
        console.log(`❌ ${this.errors.length} Error(s):`);
        this.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
        console.log();
      }

      if (this.warnings.length > 0) {
        console.log(`⚠️  ${this.warnings.length} Warning(s):`);
        this.warnings.forEach((warning, index) => {
          console.log(`  ${index + 1}. ${warning}`);
        });
        console.log();
      }
    }

    if (this.errors.length > 0) {
      process.exit(1);
    }
  }
}

async function main() {
  const validator = new ExampleValidator();
  await validator.validate();
}

main().catch(console.error);