import { prisma } from '@/db/index.js';
import { escapeHtml } from '@/lib/htmlEscape.js';

function formatLastMod(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Sitemap 0.9 document: home + every enabled public embed URL.
 */
export async function buildSitemapXml(siteUrl: string): Promise<string> {
  const base = siteUrl.replace(/\/$/, '');
  const rows: { loc: string; lastmod?: string }[] = [{ loc: `${base}/` }];

  const embeds = await prisma.project.findMany({
    where: {
      embedEnabled: true,
      embedToken: { not: null },
      user: { badge: 'chronographer' },
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

export function buildRobotsTxt(siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  return `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;
}
