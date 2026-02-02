import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join, parse } from 'path';

const LOGO_DIR = './src/assets/images/logo';
const TARGET_WIDTH = 200; // Suitable for header logo

async function compressLogos() {
  const files = await readdir(LOGO_DIR);
  const pngFiles = files.filter(f => f.endsWith('.png') && !f.includes('_small'));

  for (const file of pngFiles) {
    const inputPath = join(LOGO_DIR, file);
    const { name } = parse(file);
    const outputPath = join(LOGO_DIR, `${name}_small.png`);

    await sharp(inputPath)
      .resize(TARGET_WIDTH, null, { withoutEnlargement: true })
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(outputPath);

    console.log(`✓ Created: ${outputPath}`);
  }

  console.log('\nDone! Compressed logos created with _small suffix.');
}

compressLogos().catch(console.error);
