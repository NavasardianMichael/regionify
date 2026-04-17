#!/usr/bin/env node

/**
 * lint-staged function for client files
 * Runs ESLint --fix on staged client files
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');
const clientDir = join(rootDir, 'client');

// Get staged files from lint-staged (passed as command line arguments)
const files = process.argv.slice(2);

if (files.length === 0) {
  process.exit(0);
}

// Convert file paths to be relative to client directory
const clientFiles = files
  .map((file) => file.replace(/^client\//, ''))
  .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'));

if (clientFiles.length === 0) {
  process.exit(0);
}

try {
  execSync(`pnpm exec eslint --fix ${clientFiles.join(' ')}`, {
    cwd: clientDir,
    stdio: 'inherit',
  });
} catch (error) {
  process.exit(1);
}
