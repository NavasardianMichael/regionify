#!/usr/bin/env node

/**
 * Post-install: Prisma client + pending migrations (local dev only).
 *
 * - Always runs `prisma generate` (required for TypeScript/build).
 * - Runs `prisma migrate deploy` when DATABASE_URL is set after loading server env
 *   files (.env → .env.local → .env.development.local). Applies only pending migrations.
 *
 * Skips migrations when CI=true / GITHUB_ACTIONS=true or NODE_ENV=production so
 * `pnpm install` in CI/Docker build does not require a database.
 *
 * Production runtime: run `prisma migrate deploy` in your deploy step (this repo’s
 * deploy workflow runs it via docker compose before `up` the server).
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const serverRoot = join(__dirname, '..');

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const isProduction = process.env.NODE_ENV === 'production';

/** Load server env files in order; later files override earlier (local dev convention). */
function loadServerEnvFiles() {
  const files = ['.env', '.env.local', '.env.development.local'];
  for (const name of files) {
    const path = join(serverRoot, name);
    if (existsSync(path)) {
      dotenv.config({ path, override: true });
    }
  }
}

const shouldTryMigrations = !isCI && !isProduction;

console.log('🔧 Running post-install setup...\n');

console.log('📦 Generating Prisma client...');
try {
  execSync('pnpm exec prisma generate', {
    cwd: serverRoot,
    stdio: 'inherit',
  });
  console.log('✅ Prisma client generated successfully\n');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  process.exit(1);
}

if (!shouldTryMigrations) {
  if (isCI) {
    console.log('ℹ️  CI detected — skipping `prisma migrate deploy` (no DB on install).\n');
  } else {
    console.log('ℹ️  NODE_ENV=production — skipping `prisma migrate deploy` on install.\n');
  }
  console.log('✅ Post-install setup complete!\n');
  process.exit(0);
}

loadServerEnvFiles();

if (!process.env.DATABASE_URL) {
  console.log('ℹ️  No DATABASE_URL — skipping `prisma migrate deploy`.');
  console.log(
    '   Add server/.env (or .env.local / .env.development.local) to auto-apply migrations after install.\n',
  );
  console.log('✅ Post-install setup complete!\n');
  process.exit(0);
}

console.log('🗄️  Applying pending migrations (`prisma migrate deploy`)...');
try {
  execSync('pnpm exec prisma migrate deploy', {
    cwd: serverRoot,
    stdio: 'inherit',
    env: { ...process.env },
  });
  console.log('✅ Migrations up to date\n');
} catch (error) {
  console.warn('\n⚠️  `prisma migrate deploy` failed.');
  console.warn(
    'Common causes: database not running, wrong DATABASE_URL, or drift (baseline/resolve).',
  );
  console.warn(
    'Fix locally, then re-run: pnpm --filter @regionify/server exec prisma migrate deploy\n',
  );
  // Do not fail install: clones without DB should still get a working Prisma client.
}

console.log('✅ Post-install setup complete!\n');
