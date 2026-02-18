#!/usr/bin/env node

/**
 * Post-install setup script for local development.
 * Handles Prisma client generation and database migrations.
 * Skips migrations in CI/CD and production environments.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Calculate paths relative to this script location
// Script is at: server/scripts/postinstall-setup.js
// Server root is: server/
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const serverRoot = join(__dirname, '..'); // server/scripts/ -> server/
const envFile = join(serverRoot, '.env.development.local'); // server/.env.development.local

// Detect environment
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const isProduction = process.env.NODE_ENV === 'production';
const hasDatabaseUrl = !!process.env.DATABASE_URL;
const hasEnvFile = existsSync(envFile);

// Only run migrations in local development (not CI/CD or production)
const shouldRunMigrations = !isCI && !isProduction && hasEnvFile && !hasDatabaseUrl;

console.log('🔧 Running post-install setup...\n');

// Step 1: Generate Prisma client (always needed)
console.log('📦 Generating Prisma client...');
try {
  execSync('pnpm prisma generate', {
    cwd: serverRoot,
    stdio: 'inherit',
  });
  console.log('✅ Prisma client generated successfully\n');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  process.exit(1);
}

// Step 2: Try to deploy migrations only in local development
if (shouldRunMigrations) {
  console.log('🗄️  Checking database migrations (local development)...');
  try {
    // Try to deploy migrations (this will apply pending migrations)
    execSync('npx dotenv-cli -e .env.development.local -- prisma migrate deploy', {
      cwd: serverRoot,
      stdio: 'inherit',
    });
    console.log('✅ Database migrations applied successfully\n');
  } catch (error) {
    console.warn('\n⚠️  Migration deployment encountered issues.');
    console.warn('This is normal if:');
    console.warn('  - Database is not running');
    console.warn('  - Migration history is out of sync');
    console.warn('  - You need to resolve migration conflicts manually\n');
    console.warn('To resolve migration issues:');
    console.warn('  1. Ensure your database is running');
    console.warn('  2. Run: pnpm db:migrate:deploy');
    console.warn('  3. If migrations are already applied, use: pnpm db:migrate:resolve --applied <migration-name>\n');
  }
} else {
  if (isCI) {
    console.log('ℹ️  CI environment detected. Skipping migrations (run separately in deployment).\n');
  } else if (isProduction) {
    console.log('ℹ️  Production environment detected. Skipping migrations (run separately in deployment).\n');
  } else if (hasDatabaseUrl) {
    console.log('ℹ️  DATABASE_URL environment variable detected. Skipping local migrations.\n');
  } else if (!hasEnvFile) {
    console.log(`ℹ️  No .env.development.local file found at: ${envFile}`);
    console.log('   Skipping database migrations.');
    console.log('   Create server/.env.development.local to enable automatic migration deployment.\n');
  }
}

console.log('✅ Post-install setup complete!\n');
