import { cpSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');

const svgSrc = join(root, 'client/src/assets/images/maps');
const svgDest = join(__dirname, '../public/svgs');

const logoSrc = join(root, 'client/public/logo.png');
const logoDest = join(__dirname, '../public/logo.png');

mkdirSync(svgDest, { recursive: true });
cpSync(svgSrc, svgDest, { recursive: true });
console.log('✓ SVG maps copied to public/svgs/');

copyFileSync(logoSrc, logoDest);
console.log('✓ Logo copied to public/logo.png');
