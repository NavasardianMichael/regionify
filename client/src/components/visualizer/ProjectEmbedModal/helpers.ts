import { getEmbedRoute } from '@/constants/routes';
import {
  IFRAME_HEIGHT_PX,
  IFRAME_TITLE,
  KEYWORD_MAX_COUNT,
  KEYWORD_MAX_LENGTH,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
} from './constants';

export function normalizeKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x): x is string => typeof x === 'string')
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, KEYWORD_MAX_COUNT);
}

export function sanitizeKeywords(tags: string[]): string[] {
  return tags
    .map((t) => t.trim().slice(0, KEYWORD_MAX_LENGTH))
    .filter((t) => t.length > 0)
    .slice(0, KEYWORD_MAX_COUNT);
}

export function buildAutoEmbedTitle(projectName: string): string {
  return `${projectName} — Regionify`.trim().slice(0, SEO_TITLE_MAX);
}

export function trimDefaultSeoDescription(text: string): string {
  return text.trim().slice(0, SEO_DESCRIPTION_MAX);
}

type BuildEmbedPageUrlInput = {
  origin: string;
  token: string | null | undefined;
  enabled: boolean;
};

export function buildEmbedPageUrl({ origin, token, enabled }: BuildEmbedPageUrlInput): string {
  if (!token || !enabled) return '';
  return `${origin}${getEmbedRoute(token)}`;
}

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
