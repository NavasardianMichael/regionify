import { escapeHtml } from '@/lib/htmlEscape.js';

export type PageMeta = {
  documentTitle: string;
  description: string;
  keywords?: string | null;
  canonicalPath: string;
};

/** Semantic SEO block outside `#root` so it survives client mount (embed only). */
export type EmbedSemanticHtml = {
  heading: string;
  /** Short visible blurb; full text stays in `<meta name="description">`. */
  intro: string;
};

function escapeJsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function renderEmbedJsonLd(opts: {
  origin: string;
  canonicalUrl: string;
  pageName: string;
  pageDescription: string;
  inLanguage: string;
}): string {
  const { origin, canonicalUrl, pageName, pageDescription, inLanguage } = opts;
  const websiteId = `${origin}#website`;
  const orgId = `${origin}#organization`;
  const pageId = `${canonicalUrl}#webpage`;
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': pageId,
        url: canonicalUrl,
        name: pageName,
        description: pageDescription,
        inLanguage,
        isPartOf: { '@id': websiteId },
        publisher: { '@id': orgId },
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: origin,
        name: 'Regionify',
        publisher: { '@id': orgId },
      },
      {
        '@type': 'Organization',
        '@id': orgId,
        name: 'Regionify',
        url: origin,
      },
    ],
  };
  return `    <script type="application/ld+json">${escapeJsonForScript(graph)}</script>\n`;
}

export function renderHtmlDocument(opts: {
  siteUrl: string;
  meta: PageMeta;
  /** Raw HTML placed inside `<div id="root">` before the client app mounts. */
  rootInnerHtml: string;
  entryJs: string;
  entryCss: string[];
  /**
   * When set, wraps the app in `<main>` + `<header>` (h1 + intro) and a flex grow region
   * for `#root`. Map / SPA still mounts only inside `#root`.
   */
  embedSemantic?: EmbedSemanticHtml;
  /** BCP 47 language preferred for `<html lang>` and JSON-LD `inLanguage`. */
  htmlLang?: string;
  /** Open Graph locale tag (underscore form, e.g. en_US). */
  ogLocale?: string;
  /** Public embed pages only: inject WebPage / WebSite / Organization JSON-LD. */
  includeEmbedJsonLd?: boolean;
}): string {
  const {
    siteUrl,
    meta,
    rootInnerHtml,
    entryJs,
    entryCss,
    embedSemantic,
    htmlLang = 'en',
    ogLocale = 'en_US',
    includeEmbedJsonLd = false,
  } = opts;
  const base = siteUrl.replace(/\/$/, '');
  const canonical = `${base}${meta.canonicalPath}`;
  const ogImage = `${base}/og-image.jpg`;

  const kw = meta.keywords?.trim();
  const keywordsTag = kw ? `    <meta name="keywords" content="${escapeHtml(kw)}" />\n` : '';

  const jsonLdBlock = includeEmbedJsonLd
    ? renderEmbedJsonLd({
        origin: base,
        canonicalUrl: canonical,
        pageName: meta.documentTitle,
        pageDescription: meta.description,
        inLanguage: htmlLang,
      })
    : '';

  const cssLinks = entryCss
    .map((href) => `    <link rel="stylesheet" crossorigin href="${escapeHtml(href)}" />`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="${escapeHtml(htmlLang)}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(meta.documentTitle)}</title>
    <meta name="title" content="${escapeHtml(meta.documentTitle)}" />
    <meta name="description" content="${escapeHtml(meta.description)}" />
${keywordsTag}    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <meta name="theme-color" content="#18294D" />
    <meta name="color-scheme" content="light" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:title" content="${escapeHtml(meta.documentTitle)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="${escapeHtml(ogLocale)}" />
    <meta property="og:site_name" content="Regionify" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeHtml(canonical)}" />
    <meta name="twitter:title" content="${escapeHtml(meta.documentTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    <meta name="robots" content="index, follow" />
    <meta name="author" content="Regionify" />
    <meta name="application-name" content="Regionify" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Regionify" />
${jsonLdBlock}${cssLinks ? `${cssLinks}\n` : ''}  </head>
  <body>
${
  embedSemantic
    ? renderEmbedBody({ rootInnerHtml, embedSemantic })
    : `    <div id="root">${rootInnerHtml}</div>
`
}
    <script type="module" crossorigin src="${escapeHtml(entryJs)}"></script>
  </body>
</html>
`;
}

function renderEmbedBody(opts: {
  rootInnerHtml: string;
  embedSemantic: EmbedSemanticHtml;
}): string {
  const h = escapeHtml(opts.embedSemantic.heading);
  const intro = escapeHtml(opts.embedSemantic.intro);
  const root = opts.rootInnerHtml;
  return `    <a href="#embed-app" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-white focus:px-3 focus:py-2 focus:shadow-md">Skip to map</a>
    <main class="flex min-h-screen min-h-0 w-full flex-col bg-gray-100">
      <header class="shrink-0 border-b border-solid border-gray-200 bg-white px-4 py-4 shadow-sm">
        <div class="mx-auto flex w-full max-w-6xl flex-col gap-1">
          <h1 class="text-primary m-0 text-xl font-semibold tracking-tight md:text-2xl">${h}</h1>
          <p class="m-0 max-w-3xl text-sm leading-relaxed text-gray-600">${intro}</p>
        </div>
      </header>
      <div id="embed-app" class="flex min-h-0 flex-1 flex-col">
        <div id="root">${root}</div>
      </div>
    </main>
`;
}
