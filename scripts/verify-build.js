#!/usr/bin/env node

/**
 * Build verification script
 * Ensures that the TypeScript build completed successfully and all essential files exist
 */

import { existsSync, statSync } from 'fs';
import { join } from 'path';

const requiredFiles = [
  'lib/cli/index.js',
  'lib/apk/APKBuilder.js',
  'lib/apk/CapacitorProjectInitializer.js',
  'lib/types/index.js',
  'lib/interfaces/APKBuilder.js'
];

const requiredDirectories = [
  'lib',
  'lib/cli',
  'lib/apk',
  'lib/types',
  'lib/interfaces'
];

console.log('🔍 Verifying TypeScript build output...\n');

let hasErrors = false;

// Check directories
console.log('📁 Checking required directories:');
for (const dir of requiredDirectories) {
  if (existsSync(dir)) {
    const stats = statSync(dir);
    if (stats.isDirectory()) {
      console.log(`  ✅ ${dir}`);
    } else {
      console.log(`  ❌ ${dir} (not a directory)`);
      hasErrors = true;
    }
  } else {
    console.log(`  ❌ ${dir} (missing)`);
    hasErrors = true;
  }
}

console.log('\n📄 Checking required files:');
for (const file of requiredFiles) {
  if (existsSync(file)) {
    const stats = statSync(file);
    if (stats.isFile() && stats.size > 0) {
      console.log(`  ✅ ${file} (${stats.size} bytes)`);
    } else {
      console.log(`  ❌ ${file} (empty or invalid)`);
      hasErrors = true;
    }
  } else {
    console.log(`  ❌ ${file} (missing)`);
    hasErrors = true;
  }
}

// Check for TypeScript declaration files
console.log('\n📝 Checking TypeScript declarations:');
const declarationFiles = [
  'lib/cli/index.d.ts',
  'lib/apk/APKBuilder.d.ts',
  'lib/types/index.d.ts'
];

for (const file of declarationFiles) {
  if (existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ⚠️  ${file} (missing declaration)`);
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Build verification FAILED');
  console.log('💡 Try running: npm run clean && npm run build');
  process.exit(1);
} else {
  console.log('✅ Build verification PASSED');
  console.log('🎉 All required files are present and valid');
  process.exit(0);
}