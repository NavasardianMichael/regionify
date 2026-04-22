import { escapeHtml } from '@/lib/htmlEscape.js';

/** Default home SEO copy (aligned with `client/index.html` and `client/src/locales/en.ts` home strings). */
export const HOME_PAGE_DEFAULT = {
  documentTitle: 'Regionify — Choropleth maps from CSV, Excel & Google Sheets',
  metaDescription:
    'Build interactive choropleth maps in the browser: import CSV, Excel, JSON, or Google Sheets, match regions with fuzzy labels, customize legends, and export PNG, SVG, or JPEG. Time-series and embeds on higher badge tiers.',
  metaKeywords:
    'choropleth map, regional map, CSV to map, Excel map visualization, Google Sheets map, data visualization, SVG map, Regionify',
  heading: 'Regionify',
  welcome: 'Create beautiful interactive regional map visualizations.',
} as const;

/** Minimal visible HTML inside `#root` for `/` when Express serves the document (SPA routes use an empty shell). */
export function homeRootInnerHtml(): string {
  const h = escapeHtml(HOME_PAGE_DEFAULT.heading);
  const w = escapeHtml(HOME_PAGE_DEFAULT.welcome);
  return `
    <div class="flex h-full min-h-0 w-full flex-col items-center">
      <div class="flex w-full max-w-4xl flex-col gap-4 p-6">
        <h1 class="text-primary text-3xl font-bold">${h}</h1>
        <p class="text-gray-600">${w}</p>
      </div>
    </div>`;
}
