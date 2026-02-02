import { copyFileSync, existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const source = resolve(root, '.github/copilot-instructions.md');
const sourceContent = readFileSync(source, 'utf-8');
const targets = [resolve(root, '.cursorrules'), resolve(root, 'CLAUDE.md')];

targets.forEach((target) => {
  const targetName = target.replace(root, '').replace(/^[\\/]/, '');
  const targetContent = existsSync(target) ? readFileSync(target, 'utf-8') : '';

  if (sourceContent !== targetContent) {
    copyFileSync(source, target);
    console.log(`✓ Synced ${targetName}`);
  } else {
    console.log(`· ${targetName} already up to date`);
  }
});
