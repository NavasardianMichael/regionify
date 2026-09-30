import { type FaqItem, type GuideMeta, type GuideStep } from '@/data/guides/types';

const CLIENT_URL = import.meta.env.CLIENT_URL ?? '';

/**
 * Stable `@id`s, mirrored from `server/src/web/coreJsonLd.ts` so the app and the marketing
 * site describe ONE product entity rather than two anonymous, subtly different ones.
 */
export const SOFTWARE_ID = `${CLIENT_URL}#software`;
export const ORGANIZATION_ID = `${CLIENT_URL}#organization`;

export type JsonLdNode = Record<string, unknown>;

/**
 * Mirrors `escapeJsonForScript` in `server/src/web/renderHtmlDocument.ts`. Only `</script`
 * can terminate a raw-text element, but guide steps embed literal `<iframe …>` markup, so
 * escaping `<` keeps that one bad string from breaking a page.
 */
export function jsonLdScriptText(node: JsonLdNode): string {
  return JSON.stringify(node).replace(/</g, '\\u003c');
}

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export function buildBreadcrumbJsonLd(items: readonly BreadcrumbItem[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function buildHowToStep(step: GuideStep, canonicalUrl: string): JsonLdNode {
  return {
    '@type': 'HowToStep',
    name: step.name,
    text: step.text,
    url: `${canonicalUrl}#${step.id}`,
  };
}

/**
 * Google retired `HowTo` rich results in September 2023, so this earns no SERP treatment.
 * It is emitted for answer engines, which still parse it.
 */
export function buildHowToJsonLd(guide: GuideMeta, canonicalUrl: string): JsonLdNode | null {
  if (guide.kind !== 'howTo' || !guide.steps || guide.steps.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': `${canonicalUrl}#howto`,
    name: guide.h1,
    description: guide.summary,
    ...(guide.totalTime ? { totalTime: guide.totalTime } : {}),
    mainEntityOfPage: canonicalUrl,
    about: { '@id': SOFTWARE_ID },
    step: guide.steps.map((step) => buildHowToStep(step, canonicalUrl)),
  };
}

/** One `@type` only — `Article` + `TechArticle` on the same node is ambiguous. */
export function buildTechArticleJsonLd(guide: GuideMeta, canonicalUrl: string): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${canonicalUrl}#article`,
    headline: guide.h1.slice(0, 110),
    description: guide.summary,
    datePublished: guide.datePublished,
    dateModified: guide.dateModified,
    mainEntityOfPage: canonicalUrl,
    author: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
    about: { '@id': SOFTWARE_ID },
  };
}

/**
 * At most one per page. Google limited `FAQPage` rich results to authoritative gov/health
 * sites in August 2023; this is emitted for answer-engine ingestion, not for a rich result.
 */
export function buildFaqJsonLd(items: readonly FaqItem[], canonicalUrl: string): JsonLdNode | null {
  if (items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${canonicalUrl}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildGuideCollectionJsonLd(
  guides: readonly GuideMeta[],
  canonicalUrl: string,
  guideUrl: (slug: string) => string,
): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${canonicalUrl}#collection`,
    name: 'Regionify guides',
    description:
      'Step-by-step guides for building, embedding, animating and exporting regional maps from your own data.',
    url: canonicalUrl,
    about: { '@id': SOFTWARE_ID },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: guides.map((guide, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: guide.navLabel,
        url: guideUrl(guide.slug),
      })),
    },
  };
}

/** Drops nulls so pages can pass builder results straight through to the layout. */
export function compactJsonLd(nodes: readonly (JsonLdNode | null)[]): JsonLdNode[] {
  return nodes.filter((node): node is JsonLdNode => node !== null);
}
