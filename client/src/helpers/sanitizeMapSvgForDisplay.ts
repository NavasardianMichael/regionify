/**
 * Prep styled map SVG for preview injection.
 * Source maps are bundled assets (not user HTML); avoid DOMPurify — it strips
 * SVG presentation attrs inconsistently across browsers and was leaving gray
 * "no data" / default fills in Chrome.
 */
export function sanitizeMapSvgForDisplay(styledSvg: string): string {
  return styledSvg
    .replace(/^\uFEFF/, '')
    .replace(/<\?xml[^?]*\?>\s*/i, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}
