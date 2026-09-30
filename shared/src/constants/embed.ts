/**
 * Public embed iframe contract. Lives in shared so the marketing site can publish the exact
 * snippet the app hands users — a near-copy on the marketing side would silently drift.
 *
 * `buildEmbedPageUrl` deliberately stays in the client: it depends on `getEmbedRoute` from
 * `client/src/constants/routes.ts`, which is the single source of truth for app paths.
 */

/** Default iframe height, in CSS pixels. */
export const IFRAME_HEIGHT_PX = 560;

/** Default iframe `title`; embedders are encouraged to replace it with something descriptive. */
export const IFRAME_TITLE = 'Regionify map';

/** Iframe only — nothing is emitted into the host page alongside it. */
export function buildIframeSnippet(embedPageUrl: string): string {
  if (!embedPageUrl) return '';
  return [
    '<iframe',
    `  src="${embedPageUrl}"`,
    '  width="100%"',
    `  height="${IFRAME_HEIGHT_PX}"`,
    '  style="border:0"',
    `  title="${IFRAME_TITLE}"`,
    '></iframe>',
  ].join('\n');
}
