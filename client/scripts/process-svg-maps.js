/**
 * Script to process SVG map files:
 * 1. Rename files from [country]High.svg to [country].svg
 * 2. Remove <style> tags from SVG content
 *
 * Run with: node scripts/process-svg-maps.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAPS_DIR = path.resolve(__dirname, '../src/assets/images/maps');

async function processSvgMaps() {
  const files = fs.readdirSync(MAPS_DIR);

  let renamedCount = 0;
  let processedCount = 0;

  for (const file of files) {
    if (!file.endsWith('.svg')) continue;

    const filePath = path.join(MAPS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Remove <style> tags and their content
    const styleTagRegex = /<style[^>]*>[\s\S]*?<\/style>/gi;
    const originalContent = content;
    content = content.replace(styleTagRegex, '');

    // Also remove the .land class from paths since we removed the style
    // and replace with default styling attributes
    content = content.replace(/class="land"/g, '');

    if (content !== originalContent) {
      processedCount++;
    }

    // Write cleaned content
    fs.writeFileSync(filePath, content, 'utf-8');

    // Rename file if it has "High" suffix
    if (file.endsWith('High.svg')) {
      const newFileName = file.replace('High.svg', '.svg');
      const newFilePath = path.join(MAPS_DIR, newFileName);

      fs.renameSync(filePath, newFilePath);
      renamedCount++;
      console.log(`Renamed: ${file} -> ${newFileName}`);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Total files renamed: ${renamedCount}`);
  console.log(`Total files with style removed: ${processedCount}`);
}

processSvgMaps().catch(console.error);
