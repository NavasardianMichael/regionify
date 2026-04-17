/**
 * Must match the message thrown in server `projectEmbedService` when the user
 * lacks Chronographer (public embed).
 */
export const EMBED_BADGE_ERROR_EN = 'Public embed requires Chronographer badge';

export const SEO_TITLE_MAX = 200;
export const SEO_DESCRIPTION_MAX = 150;
export const KEYWORD_MAX_COUNT = 5;
export const KEYWORD_MAX_LENGTH = 80;
export const ALLOWED_ORIGIN_MAX_COUNT = 20;
export const ALLOWED_ORIGIN_MAX_LENGTH = 200;

export const IFRAME_HEIGHT_PX = 560;
export const IFRAME_TITLE = 'Regionify map';

export const TEXTAREA_STYLES = {
  textarea: { resize: 'none' as const },
};
