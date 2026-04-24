import { readFileSync } from 'node:fs';
import type { PathLike } from 'node:fs';

/**
 * Loads a marketing `public/svgs/*.svg` map and normalizes it for use as a low-contrast
 * hero background (white shapes, full-bleed, object-cover friendly) — same idea as the app
 * homepage world map watermark.
 */
export function readSvgHeroWatermarkFromFile(mapPath: PathLike): string | null {
  try {
    let raw = readFileSync(mapPath, 'utf-8');
    raw = raw.replace(/^\uFEFF/, '').replace(/^<\?xml[^>]*\?>\s*/i, '');
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
