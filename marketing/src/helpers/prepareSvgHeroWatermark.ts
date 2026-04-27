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

export function getMapsDir(): string {
  return MAPS_DIR;
}

export function readSvgHeroWatermarkFromFile(regionId: string): string | null {
  try {
    let raw = readFileSync(join(MAPS_DIR, `${regionId}.svg`), 'utf-8');
    raw = raw.replace(/^﻿/, '').replace(/^<\?xml[^>]*\?>\s*/i, '');
    raw = raw.replace(/\s+width="[^"]*"/gi, '').replace(/\s+height="[^"]*"/gi, '');
    if (!/\bviewBox\s*=/i.test(raw)) {
      raw = raw.replace(
        /<svg(\s[^>]*)>/i,
        '<svg$1 viewBox="0 0 820 1250" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">',
      );
    } else {
      raw = raw.replace(
        /<svg(\s[^>]*)>/i,
        '<svg$1 width="100%" height="100%" preserveAspectRatio="xMidYMid slice">',
      );
    }
    raw = raw.replace(/<path(\s[^>]*?)(\s*\/?>)/gi, (_full, attrs: string, end: string) => {
      const cleaned = attrs
        .replace(/\s+fill="[^"]*"/gi, '')
        .replace(/\s+stroke="[^"]*"/gi, '')
        .replace(/\s+stroke-width="[^"]*"/gi, '')
        .replace(/\s+style="[^"]*"/gi, '');
      return `<path fill="white" stroke="none"${cleaned}${end}`;
    });
    return raw;
  } catch {
    return null;
  }
}
