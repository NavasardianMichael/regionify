/**
 * Creates (or updates) a Regionify project for a country and enables public embed.
 * Saves `embed_public_url` to the country's `meta.json`.
 *
 * Requires env vars: REGIONIFY_EMAIL, REGIONIFY_PASSWORD
 * Uses the CLIENT_URL from marketing/.env (defaults to https://regionify.pro).
 *
 * Idempotent: if a project named "[Regionify Marketing] {slug}" already exists for
 * the authenticated user, it is updated rather than duplicated.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from 'dotenv';
import {
  parseMarketingDataContent,
  resolveDisplayYear,
  shouldUseGdpPerCapita,
} from './lib/marketingDataCsv.ts';

// Load marketing/.env
config({ path: join(import.meta.dirname ?? process.cwd(), '..', '.env') });

const BASE_URL = (process.env['CLIENT_URL'] ?? 'https://regionify.pro').replace(/\/$/, '');
const EMAIL = process.env['REGIONIFY_EMAIL'];
const PASSWORD = process.env['REGIONIFY_PASSWORD'];

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

type Project = {
  id: string;
  name: string;
  embed: {
    enabled: boolean;
    token: string | null;
    showHeader: boolean;
    seo: {
      title: string | null;
      description: string | null;
      keywords: string[] | null;
      allowedOrigins: string[] | null;
    };
  };
};

type MetaJson = {
  slug: string;
  region_id: string;
  seo_title?: string;
  seo_description?: string;
  dataset_year?: string;
  embed_public_url?: string;
  [key: string]: unknown;
};

async function apiFetch<T>(
  path: string,
  opts: { method?: string; body?: unknown; cookie?: string },
): Promise<{ data: T; cookie?: string }> {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(opts.cookie ? { Cookie: opts.cookie } : {}),
    },
    body: opts.body != null ? JSON.stringify(opts.body) : undefined,
  });

  const setCookie = res.headers.get('set-cookie');
  let json: ApiResult<T>;
  try {
    json = (await res.json()) as ApiResult<T>;
  } catch {
    throw new Error(`API ${path}: non-JSON response (HTTP ${res.status})`);
  }
  if (!json.success) {
    throw new Error(`API ${path}: ${json.error.code} — ${json.error.message}`);
  }
  return { data: (json as { success: true; data: T }).data, cookie: setCookie ?? undefined };
}

function extractSessionCookie(setCookieHeader: string): string {
  // Keep only the name=value part of the first cookie
  return setCookieHeader.split(';')[0] ?? '';
}

function buildDataset(
  longRows: Array<{ svg_id: string; name_en: string; value: number; population: number }>,
): { allIds: string[]; byId: Record<string, { id: string; label: string; value: number }> } {
  const allIds: string[] = [];
  const byId: Record<string, { id: string; label: string; value: number }> = {};
  for (const r of longRows) {
    if (allIds.includes(r.svg_id)) continue;
    allIds.push(r.svg_id);
    // Use gdp per capita if available; otherwise use population
    const val = Number.isFinite(r.value) && r.value > 0 ? r.value : r.population;
    byId[r.svg_id] = { id: r.svg_id, label: r.name_en, value: val };
  }
  return { allIds, byId };
}

export async function provisionProject(opts: {
  slug: string;
  metaPath: string;
  dataPath: string;
}): Promise<void> {
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      'REGIONIFY_EMAIL and REGIONIFY_PASSWORD must be set in marketing/.env\n' +
        'Example:\n  REGIONIFY_EMAIL=you@example.com\n  REGIONIFY_PASSWORD=yourpassword',
    );
  }

  const meta = JSON.parse(readFileSync(opts.metaPath, 'utf-8')) as MetaJson;

  // Parse data.csv for the latest year
  const csvContent = readFileSync(opts.dataPath, 'utf-8');
  const { longRows } = parseMarketingDataContent(csvContent, meta);
  const displayYear = resolveDisplayYear(meta, longRows);
  const useGdp = shouldUseGdpPerCapita(longRows, displayYear);

  const displayRows = longRows
    .filter((r) => r.year === displayYear)
    .map((r) => ({
      svg_id: r.svg_id,
      name_en: r.name_en,
      value: useGdp ? r.value : r.population,
      population: r.population,
    }));

  if (displayRows.length === 0) {
    throw new Error(`No data rows for year ${displayYear} in ${opts.dataPath}`);
  }

  const projectName = `[Regionify Marketing] ${opts.slug}`;
  console.log(`  Provisioning project: "${projectName}"`);

  // Login
  const loginRes = await apiFetch<{ user: { id: string } }>('/auth/login', {
    method: 'POST',
    body: { email: EMAIL, password: PASSWORD, forceLogin: true },
  });
  const sessionCookie = loginRes.cookie ? extractSessionCookie(loginRes.cookie) : '';
  if (!sessionCookie) throw new Error('Login did not return a session cookie');
  console.log('  ✓ logged in');

  try {
    // Find existing project
    const listRes = await apiFetch<Project[]>('/projects', { cookie: sessionCookie });
    const existing = listRes.data.find((p) => p.name === projectName);

    const dataset = buildDataset(displayRows);

    let projectId: string;
    if (existing) {
      projectId = existing.id;
      await apiFetch(`/projects/${projectId}`, {
        method: 'PUT',
        body: { dataset, countryId: meta.region_id },
        cookie: sessionCookie,
      });
      console.log(`  ✓ updated existing project (id: ${projectId})`);
    } else {
      const createRes = await apiFetch<Project>('/projects', {
        method: 'POST',
        body: { name: projectName, countryId: meta.region_id, dataset },
        cookie: sessionCookie,
      });
      projectId = createRes.data.id;
      console.log(`  ✓ created project (id: ${projectId})`);
    }

    // Enable public embed
    const embedRes = await apiFetch<{ embed: Project['embed'] }>(`/projects/${projectId}/embed`, {
      method: 'PUT',
      body: {
        enabled: true,
        showHeader: true,
        seo: {
          title: meta.seo_title ?? `${opts.slug} — Regionify`,
          description: meta.seo_description ?? `Choropleth map of ${opts.slug}`,
          allowedOrigins: ['https://regionify.pro'],
        },
      },
      cookie: sessionCookie,
    });

    const token = embedRes.data.embed.token;
    if (!token) throw new Error('Embed response did not include a token');
    const embedUrl = `${BASE_URL}/embed/${token}`;
    console.log(`  ✓ embed enabled: ${embedUrl}`);

    // Save to meta.json
    meta.embed_public_url = embedUrl;
    writeFileSync(opts.metaPath, JSON.stringify(meta, null, 2) + '\n');
    console.log(`  ✓ embed_public_url saved to meta.json`);
  } finally {
    // Logout
    try {
      await apiFetch('/auth/logout', { method: 'POST', cookie: sessionCookie });
    } catch {
      // Non-fatal
    }
  }
}

// CLI usage: tsx provision-project.ts <slug>
if (import.meta.url === `file://${process.argv[1]}`) {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: tsx scripts/provision-project.ts <slug>');
    process.exit(1);
  }
  const assetsRoot = join(import.meta.dirname ?? process.cwd(), '..', 'assets');
  provisionProject({
    slug,
    metaPath: join(assetsRoot, slug, 'meta.json'),
    dataPath: join(assetsRoot, slug, 'data.csv'),
  }).catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });
}
