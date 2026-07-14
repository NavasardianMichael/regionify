import { escapeHtml } from '@/lib/htmlEscape.js';

/** Default home SEO copy (aligned with `client/index.html` and `client/src/locales/en.ts` home strings). */
export const HOME_PAGE_DEFAULT = {
  documentTitle: 'Regionify — Choropleth Maps, Live Embeds & Animated Exports',
  metaDescription:
    'Build interactive choropleth maps from CSV, Excel, JSON, or live Google Sheets data. Export an animated regional map as GIF or MP4 video, or share an embedded regional map anywhere with a responsive iframe that always shows live data. One-time price — no subscription.',
  metaKeywords:
    'choropleth map, regional map, embedded regional map, iframe map embed, live data map, animated regional map, video regional map export, CSV to map, Google Sheets map, Regionify',
  heading: 'Regionify',
  welcome:
    'Create beautiful interactive regional map visualizations — import live data, export an animated regional map as GIF or MP4, or embed a live map anywhere with a simple iframe.',
} as const;

const HOME_FEATURE_BULLETS: readonly string[] = [
  'Import CSV, Excel, JSON, or connect a live Google Sheets data source.',
  'Export publication-ready PNG, SVG, or JPEG choropleth maps.',
  'Turn time-series data into an animated regional map — export as GIF or MP4 video.',
  'Share a live embedded regional map anywhere with a responsive iframe, always in sync with your data.',
  'Publish a public map page with its own SEO title and description.',
];

/** Minimal visible HTML inside `#root` for `/` when Express serves the document (SPA routes use an empty shell). */
export function homeRootInnerHtml(): string {
  const h = escapeHtml(HOME_PAGE_DEFAULT.heading);
  const w = escapeHtml(HOME_PAGE_DEFAULT.welcome);
  const bullets = HOME_FEATURE_BULLETS.map((b) => `<li>${escapeHtml(b)}</li>`).join('');
  return `
    <div class="flex h-full min-h-0 w-full flex-col items-center">
      <div class="flex w-full max-w-4xl flex-col gap-4 p-6">
        <h1 class="text-primary text-3xl font-bold">${h}</h1>
        <p class="text-gray-600">${w}</p>
        <h2 class="text-primary text-xl font-semibold">Turn data into regional maps</h2>
        <ul class="list-disc pl-5 text-gray-600">${bullets}</ul>
      </div>
    </div>`;
}
