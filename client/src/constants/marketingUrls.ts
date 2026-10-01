/**
 * The Astro marketing microsite lives at `/marketing/*`, served directly by nginx and
 * completely outside React Router.
 *
 * These are deliberately NOT in `ROUTES`: that table is the source of truth for paths the
 * SPA itself serves, and adding these would invite an `AppNavLink`/`<Link>` that navigates
 * client-side and dead-ends in the router. Always link to them with a plain `<a href>` so
 * the browser performs a full document navigation.
 *
 * This is the mirror of `MARKETING_LINKS_TO_APP` in `marketing/src/helpers/marketing.ts`.
 * Paths here must exist in the marketing site's build output.
 */
export const MARKETING_URLS = {
  /** Country hub — one page per country, 190 of them. */
  COUNTRY_MAPS: '/marketing/',
  /** How-to guides index. */
  GUIDES: '/marketing/how-to/',
} as const;

export type MarketingUrl = (typeof MARKETING_URLS)[keyof typeof MARKETING_URLS];
