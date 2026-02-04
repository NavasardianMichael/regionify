const fs = require('fs');
const path = require('path');

const env = process.argv[2];

if (!env) {
  console.error('Usage: pnpm envtobase64 <environment>');
  console.error('Example: pnpm envtobase64 production');
  process.exit(1);
}

const envFile = `.env.${env}.local`;
const envPath = path.join(__dirname, '..', envFile);

if (!fs.existsSync(envPath)) {
  console.error(`File not found: ${envPath}`);
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf-8');
const base64 = Buffer.from(content).toString('base64');

console.log(`\n📄 Encoded ${envFile} to base64:\n`);
console.log(base64);
console.log('\n');
