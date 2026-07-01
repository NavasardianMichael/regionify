import { prisma } from '@/db/index.js';
import { escapeHtml } from '@/lib/htmlEscape.js';

const PUBLIC_STATIC_PATHS = ['/', '/about', '/contact', '/faq', '/terms', '/privacy', '/refund'];

function formatLastMod(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Sitemap 0.9 document: public static routes + every enabled public embed URL.
 */
export async function buildAppSitemapXml(siteUrl: string): Promise<string> {
  const base = siteUrl.replace(/\/$/, '');
  const rows: { loc: string; lastmod?: string }[] = PUBLIC_STATIC_PATHS.map((path) => ({
    loc: `${base}${path}`,
  }));

  const embeds = await prisma.project.findMany({
    where: {
      embedEnabled: true,
      embedToken: { not: null },
    },
    select: { embedToken: true, updatedAt: true },
  });

  for (const row of embeds) {
    if (row.embedToken === null) continue;
    rows.push({
      loc: `${base}/embed/${encodeURIComponent(row.embedToken)}`,
      lastmod: formatLastMod(row.updatedAt),
    });
  }

  const body = rows
    .map((u) => {
      const lastmodLine = u.lastmod !== undefined ? `\n    <lastmod>${u.lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeHtml(u.loc)}</loc>${lastmodLine}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

/**
 * Sitemap index referencing the app sitemap and the Astro-generated marketing sitemap.
 *
 * Points at `marketing/sitemap-0.xml` (the actual `<urlset>`), not
 * `marketing/sitemap-index.xml` — a `<sitemapindex>` must not reference another
 * `<sitemapindex>` (Google Search Console flags this as "Nested indexing").
 * `@astrojs/sitemap` always wraps output in an index even for a single file;
 * `sitemap-0.xml` stays the only leaf file unless the marketing site's URL
 * count exceeds the integration's 45,000-per-file chunk limit.
 */
export function buildSitemapIndexXml(siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  const sitemaps = [`${base}/app-sitemap.xml`, `${base}/marketing/sitemap-0.xml`];

  const body = sitemaps
    .map((loc) => `  <sitemap>\n    <loc>${escapeHtml(loc)}</loc>\n  </sitemap>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

export function buildRobotsTxt(siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  return `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;
}
