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
    documentTitle: 'About Regionify — Choropleth Map Visualization Tool',
    description:
      'Learn about Regionify: an in-browser tool for building interactive choropleth maps from CSV, Excel, JSON, and Google Sheets data without any coding.',
    keywords: 'about Regionify, choropleth map tool, data visualization software, map maker online',
  },
  '/contact': {
    documentTitle: 'Contact Regionify — Get in Touch',
    description:
      'Have a question or feedback? Reach out to the Regionify team. We are happy to help with anything from technical support to partnership inquiries.',
    keywords: 'contact Regionify, support, feedback, map visualization help',
  },
  '/faq': {
    documentTitle: 'FAQ — Regionify Frequently Asked Questions',
    description:
      'Answers to the most common questions about Regionify: supported data formats, export options, embedding maps, badge tiers, and more.',
    keywords:
      'Regionify FAQ, choropleth map questions, data visualization FAQ, map embed help, CSV to map',
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
