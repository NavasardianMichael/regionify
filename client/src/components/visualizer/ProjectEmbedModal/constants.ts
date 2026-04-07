import type { ModalProps } from 'antd';

/**
 * Must match the message thrown in server `projectEmbedService` when the user
 * lacks Chronographer (public embed).
 */
export const EMBED_PLAN_ERROR_EN = 'Public embed requires Chronographer plan';

export const SEO_TITLE_MAX = 200;
export const SEO_DESCRIPTION_MAX = 150;
export const KEYWORD_MAX_COUNT = 5;
export const KEYWORD_MAX_LENGTH = 80;

export const MODAL_WIDTH = 560;

export const IFRAME_HEIGHT_PX = 560;
export const IFRAME_TITLE = 'Regionify map';

export const MODAL_STYLES = {
  body: { maxHeight: 'min(70vh, 640px)', overflowY: 'auto' as const },
} satisfies NonNullable<ModalProps['styles']>;

export const TEXTAREA_STYLES = {
  textarea: { resize: 'none' as const },
};
