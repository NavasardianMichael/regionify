import { cpSync, mkdirSync, copyFileSync, existsSync, readdirSync, statSync } from 'node:fs';
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
  copyFileSync(logoSrc, faviconDest);
  console.log('✓ favicon.ico created from logo.png');
}

const assetsRoot = join(__dirname, '../assets');
const showcaseBaseDest = join(__dirname, '../public/assets');
if (existsSync(assetsRoot)) {
  for (const name of readdirSync(assetsRoot, { withFileTypes: true })) {
    if (!name.isDirectory() || name.name.startsWith('.')) continue;
    const slug = name.name;
    const showcases = join(assetsRoot, slug, 'showcases');
    if (existsSync(showcases) && statSync(showcases).isDirectory()) {
      const dest = join(showcaseBaseDest, slug);
      mkdirSync(dest, { recursive: true });
      cpSync(showcases, dest, { recursive: true });
      console.log(`✓ ${slug}/showcases/ → public/assets/${slug}/`);
    }
  }
}
