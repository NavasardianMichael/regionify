/**
 * Date (ISO 8601) of each marketing page's last *significant* change — its primary text,
 * links or structured data. Feeds the sitemap `<lastmod>` and, for guides, the visible
 * "Last updated" date and JSON-LD `dateModified`, so all three always agree.
 *
 * Bump a date only when that page's own content changes, to the day the change goes live
 * (push or merge to `master` deploys) — never earlier. Blocks repeated on every page
 * (nav, footer, CTA) do not count, and neither does the build date: Google only trusts
 * `lastmod` on sites where it consistently matches reality.
 * https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping
 *
 * Imports must stay relative and free of `import.meta.env` — `astro.config.mjs` loads this
 * file before path aliases and env are available.
 */
import countries from '../../data/countries.json';

export const HUB_LAST_MODIFIED = '2026-10-01';

/** All 190 country pages share one template, so they change together. */
export const COUNTRY_PAGES_LAST_MODIFIED = '2026-10-01';

export const GUIDE_INDEX_LAST_MODIFIED = '2026-10-01';

/**
 * Keyed by guide slug. A guide's `dateModified` must read its entry from here —
 * `assertGuideDates` fails the build when one does not.
 */
export const GUIDE_LAST_MODIFIED = {
  'embed-regional-map-iframe': '2026-10-01',
  'regional-map-from-google-sheets': '2026-10-01',
  'animated-regional-map-gif-mp4': '2026-10-01',
  'regional-map-vs-choropleth-map': '2026-10-01',
} as const satisfies Record<string, string>;

const GUIDES_SEGMENT = 'how-to';

/**
 * Resolves a page's `lastmod` from its path relative to the marketing base, e.g. `''` for
 * the hub, `india` or `how-to/embed-regional-map-iframe`. Returns `undefined` for any page
 * not listed here — omitting `<lastmod>` is valid, a guessed date is not.
 */
export function lastModifiedForPath(path: string): string | undefined {
  const segments = path.split('/').filter((segment) => segment.length > 0);

  if (segments.length === 0) return HUB_LAST_MODIFIED;

  const [first, second, ...rest] = segments;
  if (rest.length > 0) return undefined;

  if (first === GUIDES_SEGMENT) {
    if (second === undefined) return GUIDE_INDEX_LAST_MODIFIED;
    return Object.hasOwn(GUIDE_LAST_MODIFIED, second)
      ? GUIDE_LAST_MODIFIED[second as keyof typeof GUIDE_LAST_MODIFIED]
      : undefined;
  }

  return second === undefined && Object.hasOwn(countries, first)
    ? COUNTRY_PAGES_LAST_MODIFIED
    : undefined;
}
