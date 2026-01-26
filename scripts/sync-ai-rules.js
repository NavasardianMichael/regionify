import { copyFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const source = resolve(root, '.github/copilot-instructions.md');
const targets = [
  resolve(root, '.cursorrules'),
  resolve(root, 'CLAUDE.md'),
];

targets.forEach((target) => {
  copyFileSync(source, target);
  console.log(`✓ Synced ${target.replace(root, '').replace(/^[\\/]/, '')}`);
});
