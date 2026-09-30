import { animatedRegionalMapGifMp4Guide } from '@/data/guides/animatedRegionalMapGifMp4';
import { embedRegionalMapIframeGuide } from '@/data/guides/embedRegionalMapIframe';
import { regionalMapFromGoogleSheetsGuide } from '@/data/guides/regionalMapFromGoogleSheets';
import { regionalMapVsChoroplethGuide } from '@/data/guides/regionalMapVsChoropleth';
import { type GuideMeta } from '@/data/guides/types';
import { getCountries } from '@/data/parseCountries';

/** Display order on the guide index and in cross-links. */
export const GUIDES: readonly GuideMeta[] = [
  embedRegionalMapIframeGuide,
  regionalMapFromGoogleSheetsGuide,
  animatedRegionalMapGifMp4Guide,
  regionalMapVsChoroplethGuide,
];

export function otherGuides(currentSlug: string): GuideMeta[] {
  return GUIDES.filter((guide) => guide.slug !== currentSlug);
}

/**
 * Build-time dead-link guard for curated country links. Astro evaluates page frontmatter
 * during `astro build`, so a typo fails the build instead of shipping a 404.
 *
 * Note this does NOT run under `astro check` (which does not execute frontmatter) or under
 * the root `pnpm build` (which filters to client + server), so it first fires in CI's
 * `build-marketing` job.
 */
export function assertCountrySlugs(slugs: readonly string[], context: string): string[] {
  const known = new Set(getCountries().map((country) => country.slug));
  const missing = slugs.filter((slug) => !known.has(slug));

  if (missing.length > 0) {
    throw new Error(`${context}: unknown country slug(s): ${missing.join(', ')}`);
  }

  return [...slugs];
}
