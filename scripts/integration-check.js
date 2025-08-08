#!/usr/bin/env node

/**
 * Integration check script for Web-to-APK project
 * Validates all module interfaces and dependencies
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../src');

class IntegrationChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.moduleMap = new Map();
  }

  async checkProject() {
    console.log('🔍 Starting integration check...\n');

    // 1. Check file structure
    await this.checkFileStructure();

    // 2. Check imports and exports
    await this.checkImportsAndExports();

    // 3. Check interface implementations
    await this.checkInterfaceImplementations();

    // 4. Check circular dependencies
    await this.checkCircularDependencies();

    // 5. Report results
    this.reportResults();
  }

  async checkFileStructure() {
    console.log('📁 Checking file structure...');

    const expectedDirs = [
      'apk',
      'cli',
      'config',
      'interfaces',
      'logging',
      'resources',
      'types',
      'webview'
    ];

    for (const dir of expectedDirs) {
      const dirPath = path.join(srcDir, dir);
      try {
        const stat = await fs.stat(dirPath);
        if (!stat.isDirectory()) {
          this.errors.push(`Expected directory not found: ${dir}`);
        }
      } catch (error) {
        this.errors.push(`Directory missing: ${dir}`);
      }
    }

    // Check main entry point
    const mainEntry = path.join(srcDir, 'index.ts');
    try {
      await fs.access(mainEntry);
    } catch (error) {
      this.errors.push('Main entry point (src/index.ts) not found');
    }

    console.log('✅ File structure check completed\n');
  }

  async checkImportsAndExports() {
    console.log('🔗 Checking imports and exports...');

    await this.scanDirectory(srcDir);

    // Check for missing imports
    for (const [filePath, moduleInfo] of this.moduleMap) {
      for (const importPath of moduleInfo.imports) {
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          const resolvedPath = this.resolveImportPath(filePath, importPath);
          if (!this.moduleMap.has(resolvedPath)) {
            this.errors.push(`Missing import: ${importPath} in ${filePath}`);
          }
        }
      }
    }

    console.log('✅ Imports and exports check completed\n');
  }

  async checkInterfaceImplementations() {
    console.log('🔧 Checking interface implementations...');

    // This is a simplified check - in a real scenario, you'd parse TypeScript AST
    const interfaceFiles = [];
    const implementationFiles = [];

    for (const [filePath, moduleInfo] of this.moduleMap) {
      if (filePath.includes('/interfaces/')) {
        interfaceFiles.push(filePath);
      } else if (moduleInfo.content.includes('implements ')) {
        implementationFiles.push(filePath);
      }
    }

    if (interfaceFiles.length === 0) {
      this.warnings.push('No interface files found');
    }

    console.log(`Found ${interfaceFiles.length} interface files`);
    console.log(`Found ${implementationFiles.length} implementation files`);
    console.log('✅ Interface implementations check completed\n');
  }

  async checkCircularDependencies() {
    console.log('🔄 Checking for circular dependencies...');

    // Simple circular dependency detection
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (filePath) => {
      if (recursionStack.has(filePath)) {
        return true;
      }
      if (visited.has(filePath)) {
        return false;
      }

      visited.add(filePath);
      recursionStack.add(filePath);

      const moduleInfo = this.moduleMap.get(filePath);
      if (moduleInfo) {
        for (const importPath of moduleInfo.imports) {
          if (importPath.startsWith('./') || importPath.startsWith('../')) {
            const resolvedPath = this.resolveImportPath(filePath, importPath);
            if (this.moduleMap.has(resolvedPath) && hasCycle(resolvedPath)) {
              this.errors.push(`Circular dependency detected: ${filePath} -> ${resolvedPath}`);
              return true;
            }
          }
        }
      }

      recursionStack.delete(filePath);
      return false;
    };

    for (const filePath of this.moduleMap.keys()) {
      if (!visited.has(filePath)) {
        hasCycle(filePath);
      }
    }

    console.log('✅ Circular dependencies check completed\n');
  }

  async scanDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        await this.analyzeFile(fullPath);
      }
    }
  }

  async analyzeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const imports = this.extractImports(content);
      const exports = this.extractExports(content);

      this.moduleMap.set(filePath, {
        content,
        imports,
        exports
      });
    } catch (error) {
      this.errors.push(`Error reading file ${filePath}: ${error.message}`);
    }
  }

  extractImports(content) {
    const imports = [];
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  extractExports(content) {
    const exports = [];
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|interface|type|const|let|var)\s+(\w+)/g;
    let match;

    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }

  resolveImportPath(fromPath, importPath) {
    const fromDir = path.dirname(fromPath);
    let resolvedPath = path.resolve(fromDir, importPath);

    // Handle .js extensions in imports (TypeScript ESM)
    if (resolvedPath.endsWith('.js')) {
      resolvedPath = resolvedPath.replace('.js', '.ts');
    } else if (!resolvedPath.endsWith('.ts')) {
      resolvedPath += '.ts';
    }

    return resolvedPath;
  }

  reportResults() {
    console.log('📊 Integration Check Results');
    console.log('=' .repeat(50));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All checks passed! Project integration is healthy.');
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

    console.log(`📈 Statistics:`);
    console.log(`  - Total files analyzed: ${this.moduleMap.size}`);
    console.log(`  - Total errors: ${this.errors.length}`);
    console.log(`  - Total warnings: ${this.warnings.length}`);

    // Exit with error code if there are errors
    if (this.errors.length > 0) {
      process.exit(1);
    }
  }
}

async function main() {
  const checker = new IntegrationChecker();
  await checker.checkProject();
}

main().catch(console.error);