#!/usr/bin/env node

/**
 * Script to fix import paths in TypeScript files
 * Adds .js extensions to relative imports for ESM compatibility
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../src');

async function fixImportsInFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Fix relative imports without .js extension
    const fixedContent = content
      .replace(/from\s+['"](\.\/.+?)['"];/g, (match, importPath) => {
        if (!importPath.endsWith('.js') && !importPath.includes('.')) {
          return match.replace(importPath, importPath + '.js');
        }
        return match;
      })
      .replace(/from\s+['"](\.\.\/.+?)['"];/g, (match, importPath) => {
        if (!importPath.endsWith('.js') && !importPath.includes('.')) {
          return match.replace(importPath, importPath + '.js');
        }
        return match;
      })
      .replace(/import\s+(.+?)\s+from\s+['"](\.\/.+?)['"];/g, (match, imports, importPath) => {
        if (!importPath.endsWith('.js') && !importPath.includes('.')) {
          return match.replace(importPath, importPath + '.js');
        }
        return match;
      })
      .replace(/import\s+(.+?)\s+from\s+['"](\.\.\/.+?)['"];/g, (match, imports, importPath) => {
        if (!importPath.endsWith('.js') && !importPath.includes('.')) {
          return match.replace(importPath, importPath + '.js');
        }
        return match;
      });

    if (content !== fixedContent) {
      await fs.writeFile(filePath, fixedContent, 'utf-8');
      console.log(`Fixed imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

async function processDirectory(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      await fixImportsInFile(fullPath);
    }
  }
}

async function main() {
  console.log('Fixing import paths in TypeScript files...');
  await processDirectory(srcDir);
  console.log('Import path fixing completed.');
}

main().catch(console.error);