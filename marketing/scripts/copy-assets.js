import { cpSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');

const logoSrc = join(root, 'client/public/logo.png');
const logoDest = join(__dirname, '../public/logo.png');
const faviconDest = join(__dirname, '../public/favicon.ico');

copyFileSync(logoSrc, logoDest);
console.log('✓ Logo copied to public/logo.png');

const clientFavicon = join(root, 'client/public/favicon.ico');
if (existsSync(clientFavicon)) {
  copyFileSync(clientFavicon, faviconDest);
  console.log('✓ favicon.ico copied from client/public/');
} else {
  copyFileSync(logoSrc, faviconDest);
  console.log('✓ favicon.ico created from logo.png');
}

// Playwright-generated assets (marketing/assets/) → public/assets/
const playwrightAssetsSrc = join(__dirname, '../assets');
const assetsDest = join(__dirname, '../public/assets');
if (existsSync(playwrightAssetsSrc)) {
  mkdirSync(assetsDest, { recursive: true });
  cpSync(playwrightAssetsSrc, assetsDest, {
    recursive: true,
    filter: (src) => {
      const name = src.split(/[\\/]/).pop() ?? '';
      return !name.startsWith('.') && !name.startsWith('_') && !name.endsWith('.json') && !name.endsWith('.txt');
    },
  });
  console.log('✓ Playwright assets copied to public/assets/');
}
