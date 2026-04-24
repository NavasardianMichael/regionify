import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Public URL for a file under `public/assets/{slug}/`. If missing, image types fall back to
 * `public/svgs/{mapFile}` so pages work before optional screenshots are added (see
 * `data/showcase-assets/` + `scripts/copy-assets.js`).
 */
export function resolveShowcasePublicUrl(
  slug: string,
  fileName: string,
  mapFile: string,
  assetType: 'image' | 'video' | 'gif',
): string | null {
  if (!fileName.trim()) {
    return null;
  }
  const absolute = join(process.cwd(), 'public', 'assets', slug, fileName);
  if (existsSync(absolute)) {
    return `/assets/${slug}/${fileName}`;
  }
  if (assetType === 'image') {
    return `/svgs/${mapFile}`;
  }
  return null;
}

export function resolveOgImagePublicPath(
  slug: string,
  assetStatic: string | undefined,
  mapFile: string,
): string {
  if (assetStatic?.trim()) {
    const url = resolveShowcasePublicUrl(slug, assetStatic, mapFile, 'image');
    if (url) {
      return url;
    }
  }
  return `/svgs/${mapFile}`;
}
