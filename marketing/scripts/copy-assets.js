import { cpSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');

const svgSrc = join(root, 'client/src/assets/images/maps');
const svgDest = join(__dirname, '../public/svgs');

const logoSrc = join(root, 'client/public/logo.png');
const logoDest = join(__dirname, '../public/logo.png');
const faviconDest = join(__dirname, '../public/favicon.ico');

mkdirSync(svgDest, { recursive: true });
cpSync(svgSrc, svgDest, { recursive: true });
console.log('✓ SVG maps copied to public/svgs/');

copyFileSync(logoSrc, logoDest);
console.log('✓ Logo copied to public/logo.png');

const clientFavicon = join(root, 'client/public/favicon.ico');
if (existsSync(clientFavicon)) {
  copyFileSync(clientFavicon, faviconDest);
  console.log('✓ favicon.ico copied from client/public/');
} else {
  // Same PNG bytes as logo; browsers resolve /favicon.ico correctly when the app omits generated .ico files.
  copyFileSync(logoSrc, faviconDest);
  console.log('✓ favicon.ico created from logo.png');
}

const showcaseSrc = join(__dirname, '../data/showcase-assets');
const showcaseDest = join(__dirname, '../public/assets');
if (existsSync(showcaseSrc)) {
  mkdirSync(showcaseDest, { recursive: true });
  cpSync(showcaseSrc, showcaseDest, { recursive: true });
  console.log('✓ Showcase assets copied to public/assets/');
}
