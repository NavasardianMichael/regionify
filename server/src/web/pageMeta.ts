type RouteMeta = {
  documentTitle: string;
  description: string;
  keywords: string;
};

/**
 * Per-route SSR meta for public app pages.
 * The catch-all in setupWebClient.ts looks these up before falling back to HOME_PAGE_DEFAULT.
 */
export const PAGE_META_MAP: Readonly<Record<string, RouteMeta>> = {
  '/about': {
    documentTitle: 'About Regionify — Choropleth Maps & Live Embedded Maps',
    description:
      'Regionify is an in-browser tool for building interactive choropleth maps from CSV, Excel, JSON, or live Google Sheets data — then sharing them as an embedded regional map (iframe) or exporting an animated regional map as GIF or MP4 video.',
    keywords:
      'about Regionify, choropleth map tool, embedded regional map, iframe map embed, animated regional map, live data map, data visualization software',
  },
  '/contact': {
    documentTitle: 'Contact Regionify — Get in Touch',
    description:
      'Have a question or feedback? Reach out to the Regionify team. We are happy to help with anything from technical support to partnership inquiries.',
    keywords: 'contact Regionify, support, feedback, map visualization help',
  },
  '/faq': {
    documentTitle: 'FAQ — Embedding, Live Data & Animated Maps | Regionify',
    description:
      'Answers to common Regionify questions: how to embed a live regional map with an iframe, export an animated regional map as GIF or MP4 video, import CSV/Excel/Google Sheets data, and more.',
    keywords:
      'Regionify FAQ, how to embed a map, iframe map embed, embedded regional map, animated regional map, live data map, video regional map export, choropleth map questions',
  },
  '/terms': {
    documentTitle: 'Terms of Service — Regionify',
    description:
      'Read the Regionify Terms of Service to understand the rules and conditions that govern your use of our map visualization platform.',
    keywords: 'Regionify terms of service, terms and conditions, user agreement',
  },
  '/privacy': {
    documentTitle: 'Privacy Policy — Regionify',
    description:
      'Learn how Regionify collects, uses, and protects your personal data. Our privacy policy covers data storage, cookies, and your rights.',
    keywords: 'Regionify privacy policy, data protection, GDPR, personal data',
  },
  '/refund': {
    documentTitle: 'Refund Policy — Regionify',
    description:
      'Regionify refund policy: conditions under which subscription payments can be refunded and how to request one.',
    keywords: 'Regionify refund policy, subscription refund, payment terms',
  },
} as const;
