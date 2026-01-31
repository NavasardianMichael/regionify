/**
 * Script to update regions.ts mapFile references
 * Removes "High" suffix from all mapFile values
 *
 * Run with: node scripts/update-regions.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGIONS_FILE = path.resolve(__dirname, '../src/constants/regions.ts');

function updateRegionsFile() {
  let content = fs.readFileSync(REGIONS_FILE, 'utf-8');
  
  // Replace all mapFile references that have "High.svg" with just ".svg"
  content = content.replace(/mapFile: '([^']+)High\.svg'/g, "mapFile: '$1.svg'");
  
  fs.writeFileSync(REGIONS_FILE, content, 'utf-8');
  console.log('Successfully updated regions.ts');
}

updateRegionsFile();
