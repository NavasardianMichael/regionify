import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const LOGO_DIR = path.join(ROOT_DIR, 'src/assets/images/logo');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// Source images
const LOGO_ICON = path.join(LOGO_DIR, 'logo-high-resolution.png');
const LOGO_WITH_TEXT = path.join(LOGO_DIR, 'logo-high-resolution-with-text.png');

async function generateFavicons() {
  console.log('Generating favicons and app icons...\n');

  // Generate favicon-16x16.png from icon logo
  await sharp(LOGO_ICON)
    .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'));
  console.log('✓ favicon-16x16.png');

  // Generate favicon-32x32.png from icon logo
  await sharp(LOGO_ICON)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));
  console.log('✓ favicon-32x32.png');

  // Generate favicon-96x96.png from icon logo
  await sharp(LOGO_ICON)
    .resize(96, 96, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, 'favicon-96x96.png'));
  console.log('✓ favicon-96x96.png');

  // Generate favicon.ico (multi-size ICO: 16, 32, 48)
  // Sharp doesn't directly create ICO, so we'll create a 32x32 PNG and rename
  // For proper ICO, we create multiple sizes
  const ico16 = await sharp(LOGO_ICON)
    .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();
  
  const ico32 = await sharp(LOGO_ICON)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  const ico48 = await sharp(LOGO_ICON)
    .resize(48, 48, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  // Create a simple ICO file (we'll use 32x32 as the primary)
  await sharp(LOGO_ICON)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toFormat('png')
    .toFile(path.join(PUBLIC_DIR, 'favicon.png'));
  
  // For proper .ico support, copy the 32x32 as ico (browsers accept PNG as ico)
  await fs.copyFile(
    path.join(PUBLIC_DIR, 'favicon.png'),
    path.join(PUBLIC_DIR, 'favicon.ico')
  );
  await fs.unlink(path.join(PUBLIC_DIR, 'favicon.png'));
  console.log('✓ favicon.ico (32x32)');

  // Generate apple-touch-icon.png (180x180)
  await sharp(LOGO_ICON)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png (180x180)');

  // Generate web-app-manifest-192x192.png
  await sharp(LOGO_ICON)
    .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, 'web-app-manifest-192x192.png'));
  console.log('✓ web-app-manifest-192x192.png');

  // Generate web-app-manifest-512x512.png
  await sharp(LOGO_ICON)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, 'web-app-manifest-512x512.png'));
  console.log('✓ web-app-manifest-512x512.png');

  // Generate OG image from logo with text (1200x630 for social sharing)
  await sharp(LOGO_WITH_TEXT)
    .resize(1200, 630, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png({ quality: 85, compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, 'og-image.png'));
  console.log('✓ og-image.png (1200x630)');

  // Clean up old unused image
  try {
    await fs.unlink(path.join(PUBLIC_DIR, 'Gemini_Generated_Image_34t2f534t2f534t2.png'));
    console.log('✓ Removed old Gemini generated image');
  } catch {
    // File doesn't exist, ignore
  }

  console.log('\n✅ All favicons generated successfully!');
}

generateFavicons().catch(console.error);
