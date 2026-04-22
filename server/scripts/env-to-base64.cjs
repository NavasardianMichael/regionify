const fs = require('fs');
const path = require('path');

const env = process.argv[2];

// Determine which env file to use
let envFile;
let envPath;

if (env) {
  // Try environment-specific file first
  envFile = `.env.${env}.local`;
  envPath = path.join(__dirname, '..', envFile);

  if (!fs.existsSync(envPath)) {
    console.warn(`⚠️  File not found: ${envFile}, falling back to .env`);
    envFile = '.env';
    envPath = path.join(__dirname, '..', envFile);
  }
} else {
  // No environment specified, use default .env
  envFile = '.env';
  envPath = path.join(__dirname, '..', envFile);
}

if (!fs.existsSync(envPath)) {
  console.error(`❌ File not found: ${envPath}`);
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf-8').replace(/\r\n/g, '\n');
const base64 = Buffer.from(content).toString('base64');

console.log(`\n📄 Encoded ${envFile} to base64:\n`);
console.log(base64);
console.log('\n');
