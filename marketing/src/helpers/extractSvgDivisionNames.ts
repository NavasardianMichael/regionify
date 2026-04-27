import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAPS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'client',
  'src',
  'assets',
  'images',
  'maps',
);

export function extractSvgDivisionNames(regionId: string): string[] {
  try {
    const content = readFileSync(join(MAPS_DIR, `${regionId}.svg`), 'utf-8');
    return [...content.matchAll(/<path[^>]+\btitle="([^"]+)"/g)].map((m) => m[1]);
  } catch {
    return [];
  }
}
