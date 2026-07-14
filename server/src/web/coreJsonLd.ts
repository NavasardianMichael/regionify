import { BADGE_DETAILS, BADGES } from '@regionify/shared';

/** Mirrors the old static `client/index.html` graph, kept live via SSR on every public page. */
const BADGE_OFFER_DESCRIPTIONS: Readonly<Record<string, string>> = {
  [BADGES.observer]: 'Free tier: core choropleth maps, JPEG export, up to 5 saved projects.',
  [BADGES.explorer]:
    'One-time payment. PNG/SVG export, advanced styling, high-resolution export, unlimited projects.',
  [BADGES.chronographer]:
    'One-time payment. Everything in Explorer plus time-series import, animated GIF/MP4 video export, live Google Sheets sync, and an embeddable live map iframe.',
};

/** SoftwareApplication + WebSite + Organization JSON-LD, included on every public SSR page for brand/entity consistency. */
export function buildCoreJsonLd(siteUrl: string): Record<string, unknown> {
  const base = siteUrl.replace(/\/$/, '');
  const orgId = `${base}#organization`;
  const websiteId = `${base}#website`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `${base}#software`,
        name: 'Regionify',
        applicationCategory: 'DesignApplication',
        applicationSubCategory: 'Data Visualization',
        operatingSystem: 'Web',
        softwareRequirements: 'Web browser',
        url: `${base}/`,
        image: `${base}/og-image.jpg`,
        description:
          'Interactive choropleth maps: import CSV, Excel, JSON, or live Google Sheets data; export PNG, SVG, JPEG, animated GIF, MP4 video, or PDF; share as an embedded regional map via responsive iframe or a public hosted map page.',
        featureList: [
          'Import data from CSV, Excel, JSON and live Google Sheets sync',
          'Fuzzy region matching for imperfect region name labels',
          'Custom legends, color scales and label formatting',
          'Export PNG, SVG, JPEG, animated GIF, MP4 video, and PDF',
          'Animated regional map export with an interactive timeline scrubber',
          'Embeddable live map iframe with real-time data',
          'Public hosted map pages with their own SEO title and description',
        ],
        offers: [BADGES.observer, BADGES.explorer, BADGES.chronographer].map((badge) => ({
          '@type': 'Offer',
          name: badge.charAt(0).toUpperCase() + badge.slice(1),
          price: String(BADGE_DETAILS[badge].price),
          priceCurrency: 'USD',
          description: BADGE_OFFER_DESCRIPTIONS[badge],
          ...(BADGE_DETAILS[badge].price > 0
            ? {
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  priceType: 'https://schema.org/OneTimePurchase',
                },
              }
            : {}),
        })),
        publisher: { '@id': orgId },
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: base,
        name: 'Regionify',
        publisher: { '@id': orgId },
      },
      {
        '@type': 'Organization',
        '@id': orgId,
        name: 'Regionify',
        url: base,
        logo: { '@type': 'ImageObject', url: `${base}/logo-high-resolution.png` },
      },
    ],
  };
}
