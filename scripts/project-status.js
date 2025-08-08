#!/usr/bin/env node

/**
 * Project status checker - provides comprehensive overview
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

class ProjectStatusChecker {
  constructor() {
    this.status = {
      overall: 'unknown',
      modules: {},
      tests: {},
      documentation: {},
      examples: {},
      build: {}
    };
  }

  async check() {
    console.log('📊 Checking project status...\n');

    await this.checkModules();
    await this.checkTests();
    await this.checkDocumentation();
    await this.checkExamples();
    await this.checkBuild();

    this.calculateOverallStatus();
    this.generateReport();
  }

  async checkModules() {
    console.log('🔧 Checking modules...');

    const srcDir = path.join(rootDir, 'src');
    const expectedModules = [
      'apk',
      'cli', 
      'config',
      'interfaces',
      'logging',
      'resources',
      'types',
      'webview'
    ];

    for (const module of expectedModules) {
      const modulePath = path.join(srcDir, module);
      try {
        const stat = await fs.stat(modulePath);
        if (stat.isDirectory()) {
          const files = await fs.readdir(modulePath);
          const tsFiles = files.filter(f => f.endsWith('.ts'));
          this.status.modules[module] = {
            exists: true,
            fileCount: tsFiles.length,
            files: tsFiles
          };
        }
      } catch (error) {
        this.status.modules[module] = {
          exists: false,
          error: error.message
        };
      }
    }

    console.log(`✅ Found ${Object.keys(this.status.modules).length} modules\n`);
  }

  async checkTests() {
    console.log('🧪 Checking tests...');

    const testsDir = path.join(rootDir, 'tests');
    try {
      const testFiles = await this.findFiles(testsDir, '.test.ts');
      const integrationTests = await this.findFiles(path.join(testsDir, 'integration'), '.test.ts');
      const webServerTests = await this.findFiles(path.join(testsDir, 'web-server'), '.test.ts');

      this.status.tests = {
        total: testFiles.length,
        integration: integrationTests.length,
        webServer: webServerTests.length,
        coverage: await this.checkTestCoverage()
      };
    } catch (error) {
      this.status.tests = { error: error.message };
    }

    console.log(`✅ Found ${this.status.tests.total || 0} test files\n`);
  }

  async checkDocumentation() {
    console.log('📚 Checking documentation...');

    const docs = [
      'README.md',
      'DEPLOYMENT.md',
      'CHANGELOG.md'
    ];

    for (const doc of docs) {
      const docPath = path.join(rootDir, doc);
      try {
        const stat = await fs.stat(docPath);
        const content = await fs.readFile(docPath, 'utf-8');
        this.status.documentation[doc] = {
          exists: true,
          size: stat.size,
          lines: content.split('\n').length
        };
      } catch (error) {
        this.status.documentation[doc] = {
          exists: false
        };
      }
    }

    console.log(`✅ Documentation check completed\n`);
  }

  async checkExamples() {
    console.log('📁 Checking examples...');

    const examplesDir = path.join(rootDir, 'examples');
    try {
      const examples = await fs.readdir(examplesDir, { withFileTypes: true });
      
      for (const example of examples) {
        if (example.isDirectory()) {
          const examplePath = path.join(examplesDir, example.name);
          const files = await fs.readdir(examplePath);
          
          this.status.examples[example.name] = {
            exists: true,
            hasConfig: files.includes('web-to-apk.config.json'),
            hasReadme: files.includes('README.md'),
            hasPackageJson: files.includes('package.json'),
            fileCount: files.length
          };
        }
      }
    } catch (error) {
      this.status.examples = { error: error.message };
    }

    console.log(`✅ Found ${Object.keys(this.status.examples).length} examples\n`);
  }

  async checkBuild() {
    console.log('🏗️  Checking build status...');

    const libDir = path.join(rootDir, 'lib');
    try {
      const stat = await fs.stat(libDir);
      if (stat.isDirectory()) {
        const jsFiles = await this.findFiles(libDir, '.js');
        const dtsFiles = await this.findFiles(libDir, '.d.ts');
        
        this.status.build = {
          exists: true,
          jsFiles: jsFiles.length,
          declarationFiles: dtsFiles.length,
          lastBuild: stat.mtime
        };
      }
    } catch (error) {
      this.status.build = {
        exists: false,
        error: error.message
      };
    }

    console.log(`✅ Build check completed\n`);
  }

  async findFiles(dir, extension) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.findFiles(fullPath, extension);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
    
    return files;
  }

  async checkTestCoverage() {
    const coverageDir = path.join(rootDir, 'coverage');
    try {
      await fs.access(coverageDir);
      return 'available';
    } catch (error) {
      return 'not-available';
    }
  }

  calculateOverallStatus() {
    const moduleCount = Object.keys(this.status.modules).length;
    const workingModules = Object.values(this.status.modules).filter(m => m.exists).length;
    
    const testCount = this.status.tests.total || 0;
    const exampleCount = Object.keys(this.status.examples).length;
    const buildExists = this.status.build.exists;

    if (workingModules === moduleCount && testCount > 0 && exampleCount > 0 && buildExists) {
      this.status.overall = 'excellent';
    } else if (workingModules >= moduleCount * 0.8 && testCount > 0) {
      this.status.overall = 'good';
    } else if (workingModules >= moduleCount * 0.6) {
      this.status.overall = 'fair';
    } else {
      this.status.overall = 'needs-work';
    }
  }

  generateReport() {
    console.log('📋 Project Status Report');
    console.log('=' .repeat(50));

    // Overall status
    const statusEmoji = {
      excellent: '🌟',
      good: '✅',
      fair: '⚠️',
      'needs-work': '❌'
    };

    console.log(`${statusEmoji[this.status.overall]} Overall Status: ${this.status.overall.toUpperCase()}\n`);

    // Modules
    console.log('🔧 Modules:');
    for (const [name, info] of Object.entries(this.status.modules)) {
      const status = info.exists ? `✅ (${info.fileCount} files)` : '❌ Missing';
      console.log(`  ${name}: ${status}`);
    }
    console.log();

    // Tests
    console.log('🧪 Tests:');
    console.log(`  Total test files: ${this.status.tests.total || 0}`);
    console.log(`  Integration tests: ${this.status.tests.integration || 0}`);
    console.log(`  Web server tests: ${this.status.tests.webServer || 0}`);
    console.log(`  Coverage: ${this.status.tests.coverage || 'unknown'}`);
    console.log();

    // Documentation
    console.log('📚 Documentation:');
    for (const [name, info] of Object.entries(this.status.documentation)) {
      const status = info.exists ? `✅ (${info.lines} lines)` : '❌ Missing';
      console.log(`  ${name}: ${status}`);
    }
    console.log();

    // Examples
    console.log('📁 Examples:');
    for (const [name, info] of Object.entries(this.status.examples)) {
      if (info.exists) {
        const config = info.hasConfig ? '✅' : '❌';
        const readme = info.hasReadme ? '✅' : '❌';
        console.log(`  ${name}: Config ${config} README ${readme} (${info.fileCount} files)`);
      }
    }
    console.log();

    // Build
    console.log('🏗️  Build:');
    if (this.status.build.exists) {
      console.log(`  ✅ Built (${this.status.build.jsFiles} JS files, ${this.status.build.declarationFiles} .d.ts files)`);
      console.log(`  Last build: ${this.status.build.lastBuild}`);
    } else {
      console.log('  ❌ Not built');
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (this.status.overall === 'excellent') {
      console.log('  🎉 Project is in excellent condition! Ready for release.');
    } else {
      const recommendations = [];
      
      if (!this.status.build.exists) {
        recommendations.push('Run npm run build to compile TypeScript');
      }
      
      if ((this.status.tests.total || 0) < 10) {
        recommendations.push('Add more test coverage');
      }
      
      if (!this.status.documentation['CHANGELOG.md']?.exists) {
        recommendations.push('Create CHANGELOG.md file');
      }
      
      recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
  }
}

async function main() {
  const checker = new ProjectStatusChecker();
  await checker.check();
}

main().catch(console.error);