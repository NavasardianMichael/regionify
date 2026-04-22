import { escapeHtml } from '@/lib/htmlEscape.js';

export type PageMeta = {
  documentTitle: string;
  description: string;
  keywords?: string | null;
  canonicalPath: string;
  /**
   * English map region label (from project `countryId`) for embed SEO:
   * `geo.placename`, keywords, and JSON-LD `Place` when set.
   */
  regionDisplayNameEn?: string | null;
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

/** Full URL for Vite assets so `/embed/...` pages never fetch `/embed/assets/...` (HTML fallback → MIME error). */
function absoluteClientAssetUrl(originRoot: string, href: string): string {
  const o = originRoot.replace(/\/$/, '');
  const h = href.startsWith('/') ? href : `/${href}`;
  return `${o}${h}`;
}

function renderEmbedJsonLd(opts: {
  origin: string;
  canonicalUrl: string;
  pageName: string;
  pageDescription: string;
  inLanguage: string;
  /** Comma-separated keywords; mirrors `<meta name="keywords">` when set. */
  keywords?: string | null;
  /** Resolved map region label in English (country or area). */
  regionDisplayNameEn?: string | null;
}): string {
  const {
    origin,
    canonicalUrl,
    pageName,
    pageDescription,
    inLanguage,
    keywords,
    regionDisplayNameEn,
  } = opts;
  const websiteId = `${origin}#website`;
  const orgId = `${origin}#organization`;
  const pageId = `${canonicalUrl}#webpage`;
  const keywordsText = keywords?.trim() ?? '';
  const placeName = regionDisplayNameEn?.trim() ?? '';
  const webPageNode: Record<string, unknown> = {
    '@type': 'WebPage',
    '@id': pageId,
    url: canonicalUrl,
    name: pageName,
    description: pageDescription,
    inLanguage,
    isPartOf: { '@id': websiteId },
    publisher: { '@id': orgId },
  };
  if (keywordsText.length > 0) {
    webPageNode.keywords = keywordsText;
  }
  if (placeName.length > 0) {
    webPageNode.about = { '@type': 'Place', name: placeName };
  }
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      webPageNode,
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
  /**
   * When true (and `embedSemantic` is unset), applies `embed-page` shell CSS to `<html>` / `<body>`
   * with a minimal `<div id="root">` only — for invalid/disabled embed tokens that still need the embed layout.
   */
  embedShellLayout?: boolean;
  /** Value for `<meta name="robots">` (default `index, follow`). */
  robots?: string;
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
    embedShellLayout = false,
    robots = 'index, follow',
  } = opts;
  const base = siteUrl.replace(/\/$/, '');
  const canonical = `${base}${meta.canonicalPath}`;
  const ogImage = `${base}/og-image.jpg`;

  const regionEn = meta.regionDisplayNameEn?.trim() ?? '';
  const baseKw = meta.keywords?.trim() ?? '';
  const kwMerged =
    regionEn.length > 0
      ? baseKw.length > 0
        ? baseKw.toLowerCase().includes(regionEn.toLowerCase())
          ? baseKw
          : `${baseKw}, ${regionEn}`
        : regionEn
      : baseKw.length > 0
        ? baseKw
        : '';
  const kw = kwMerged.length > 0 ? kwMerged : undefined;
  const keywordsTag = kw ? `    <meta name="keywords" content="${escapeHtml(kw)}" />\n` : '';
  const geoPlacenameTag =
    regionEn.length > 0
      ? `    <meta name="geo.placename" content="${escapeHtml(regionEn)}" />\n`
      : '';

  const jsonLdBlock = includeEmbedJsonLd
    ? renderEmbedJsonLd({
        origin: base,
        canonicalUrl: canonical,
        pageName: meta.documentTitle,
        pageDescription: meta.description,
        inLanguage: htmlLang,
        keywords: kw ?? null,
        regionDisplayNameEn: regionEn.length > 0 ? regionEn : null,
      })
    : '';

  const baseHref = `${base}/`;
  const entryJsAbs = absoluteClientAssetUrl(base, entryJs);
  const cssLinks = entryCss
    .map(
      (href) =>
        `    <link rel="stylesheet" crossorigin href="${escapeHtml(absoluteClientAssetUrl(base, href))}" />`,
    )
    .join('\n');

  /** Embed: shell CSS is a separate Vite chunk linked only for `/embed/:token` (see `client/src/embed/embed-shell.css`). */
  const useEmbedPageShell = Boolean(embedSemantic) || embedShellLayout;
  const embedPageClass = useEmbedPageShell ? ' class="embed-page"' : '';

  return `<!DOCTYPE html>
<html lang="${escapeHtml(htmlLang)}"${embedPageClass}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="${escapeHtml(baseHref)}" />
    <title>${escapeHtml(meta.documentTitle)}</title>
    <meta name="title" content="${escapeHtml(meta.documentTitle)}" />
    <meta name="description" content="${escapeHtml(meta.description)}" />
${keywordsTag}${geoPlacenameTag}    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
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
    <meta name="robots" content="${escapeHtml(robots)}" />
    <meta name="author" content="Regionify" />
    <meta name="application-name" content="Regionify" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Regionify" />
${jsonLdBlock}${cssLinks ? `${cssLinks}\n` : ''}  </head>
  <body${useEmbedPageShell ? ' class="embed-page"' : ''}>
${
  embedSemantic
    ? renderEmbedBody({ rootInnerHtml, embedSemantic })
    : `    <div id="root">${rootInnerHtml}</div>
`
}
    <script type="module" crossorigin src="${escapeHtml(entryJsAbs)}"></script>
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
  return `    <a href="#embed-app" class="embed-skip-to-map">Skip to map</a>
    <main class="embed-shell-main">
      <header class="embed-shell-header">
        <h1 class="embed-shell-title">${h}</h1>
        <p class="embed-shell-intro">${intro}</p>
      </header>
      <div id="embed-app" class="embed-shell-fill">
        <div id="root" class="embed-shell-fill">${root}</div>
      </div>
    </main>
`;
}
