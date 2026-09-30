/**
 * Shared shapes for the `/how-to/` guides.
 *
 * The steps and FAQ arrays are the single source for BOTH the visible DOM and the page's
 * JSON-LD. Structured data that does not mirror visible content is ignored by search engines,
 * so nothing here may be rendered in one place and not the other.
 */

/** A code sample rendered by `CodeBlock.astro`. */
export type GuideCode = {
  /** Literal text. Rendered as an escaped Astro expression, never `set:html`. */
  code: string;
  language: 'html' | 'csv' | 'text';
  /** Accessible name fragment, e.g. "the iframe embed snippet". */
  label: string;
};

/** One numbered step. `id` must match the `<section id>` that renders it. */
export type GuideStep = {
  id: string;
  name: string;
  /** Plain text — used verbatim as the visible body and as `HowToStep.text`. */
  text: string;
  code?: GuideCode;
};

export type FaqItem = {
  question: string;
  /** Plain text — used verbatim as the visible answer and as `Answer.text`. */
  answer: string;
};

/** An entry in the table of contents. */
export type GuideSectionRef = {
  id: string;
  title: string;
};

/**
 * `howTo` emits `HowTo` JSON-LD from `steps`; `explainer` emits `TechArticle` and has none.
 */
export type GuideKind = 'howTo' | 'explainer';

export type GuideMeta = {
  /** URL segment under `/how-to/`. Kebab-case, unlike the camelCase country slugs. */
  slug: string;
  kind: GuideKind;
  /** Short label for the ToC, guide index cards and cross-links. */
  navLabel: string;
  h1: string;
  /**
   * The answer-first summary rendered directly under the H1 — 40-60 words, and the span
   * answer engines are most likely to lift. Also used as the JSON-LD description.
   */
  summary: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  /** ISO 8601 date, e.g. `2026-09-24`. */
  datePublished: string;
  dateModified: string;
  /** ISO 8601 duration, e.g. `PT5M`. Required for `howTo`, omitted for `explainer`. */
  totalTime?: string;
  steps?: GuideStep[];
  /**
   * Section anchors for `explainer` guides, whose prose lives in the page rather than in a
   * step array. `howTo` guides derive their table of contents from `steps` instead.
   */
  sections?: GuideSectionRef[];
  faq?: FaqItem[];
  /**
   * Country slugs linked as worked examples. Validated against `getCountries()` at build
   * time by `assertCountrySlugs`, so a typo fails the build rather than shipping a dead link.
   */
  exampleCountrySlugs: string[];
};
