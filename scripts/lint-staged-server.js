#!/usr/bin/env node

/**
 * lint-staged function for server files
 * Runs ESLint --fix on staged server files
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');
const serverDir = join(rootDir, 'server');

// Get staged files from lint-staged (passed as command line arguments)
const files = process.argv.slice(2);

if (files.length === 0) {
  process.exit(0);
}

// Convert file paths to be relative to server directory
const serverFiles = files
  .map((file) => file.replace(/^server\//, ''))
  .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'));

if (serverFiles.length === 0) {
  process.exit(0);
}

try {
  execSync(`pnpm exec eslint --fix ${serverFiles.join(' ')}`, {
    cwd: serverDir,
    stdio: 'inherit',
  });
} catch (error) {
  process.exit(1);
}
