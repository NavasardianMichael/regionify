import { BASE } from '@/helpers/commons';

const CLIENT_URL = import.meta.env.CLIENT_URL ?? '';

/**
 * URL segment the guides live under. Guide slugs are kebab-case while the 190 country slugs
 * are camelCase — there is no collision, and this segment namespaces them regardless.
 */
export const GUIDES_SEGMENT = 'how-to';

/** Astro does not prefix hrefs with `base`; every internal link must go through these. */
export function guideIndexPath(): string {
  return `${BASE}/${GUIDES_SEGMENT}/`;
}

export function guidePath(slug: string): string {
  return `${BASE}/${GUIDES_SEGMENT}/${slug}/`;
}

export function countryPath(slug: string): string {
  return `${BASE}/${slug}/`;
}

export function hubPath(): string {
  return `${BASE}/`;
}

/** Path relative to `BASE`, for `MarketingLayout`'s `canonicalPath` prop. */
export function guideCanonicalPath(slug: string): string {
  return `${GUIDES_SEGMENT}/${slug}`;
}

export const GUIDE_INDEX_CANONICAL_PATH = GUIDES_SEGMENT;

/** Absolute URLs — required by JSON-LD, which may not use relative references. */
export function guideIndexUrl(): string {
  return `${CLIENT_URL}${guideIndexPath()}`;
}

export function guideUrl(slug: string): string {
  return `${CLIENT_URL}${guidePath(slug)}`;
}

export function hubUrl(): string {
  return `${CLIENT_URL}${hubPath()}`;
}
