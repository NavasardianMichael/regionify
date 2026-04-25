/**
 * Georgia panel fetcher — GRP per capita (USD) per region, 5 years.
 *
 * Source priority:
 *   1. Geostat (geostat.ge) — National Statistics Office of Georgia; GRP by region (GEL)
 *   2. World Bank PA.NUS.FCRF — GEL/USD official exchange rate
 *   3. Wikidata — population + area per ISO-3166-2 GE code
 *
 * Missing (region, year) pairs are omitted — not written as empty rows.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { DATA_CSV_HEADER } from '../lib/marketingDataCsv.ts';

const WD_ENDPOINT = 'https://query.wikidata.org/sparql';
const WB_GEL_FX = 'https://api.worldbank.org/v2/country/GEO/indicator/PA.NUS.FCRF?format=json';
// Geostat open data API — Gross Regional Product by region (million GEL)
const GEOSTAT_GRP_URL = 'https://www.geostat.ge/en/modules/categories/113/gross-regional-product';

const UA = { 'User-Agent': 'RegionifyMarketing/1.0 (panel fetch; contact: regionify.pro)' };

// ISO 3166-2 codes for Georgia's regions as they appear in the SVG
const GEO_REGION_MAP: Record<
  string,
  { svg_id: string; name_en: string; name_ka: string; wd_code: string }
> = {
  'GE-AB': { svg_id: 'GE-AB', name_en: 'Abkhazia', name_ka: 'აფხაზეთი', wd_code: 'GE-AB' },
  'GE-AJ': { svg_id: 'GE-AJ', name_en: 'Adjara', name_ka: 'აჭარა', wd_code: 'GE-AJ' },
  'GE-GU': { svg_id: 'GE-GU', name_en: 'Guria', name_ka: 'გურია', wd_code: 'GE-GU' },
  'GE-IM': { svg_id: 'GE-IM', name_en: 'Imereti', name_ka: 'იმერეთი', wd_code: 'GE-IM' },
  'GE-KA': { svg_id: 'GE-KA', name_en: "K'akheti", name_ka: 'კახეთი', wd_code: 'GE-KA' },
  'GE-KK': { svg_id: 'GE-KK', name_en: 'Kvemo Kartli', name_ka: 'ქვემო ქართლი', wd_code: 'GE-KK' },
  'GE-MM': {
    svg_id: 'GE-MM',
    name_en: 'Mtskheta-Mtianeti',
    name_ka: 'მცხეთა-მთიანეთი',
    wd_code: 'GE-MM',
  },
  'GE-RL': {
    svg_id: 'GE-RL',
    name_en: "Rach'a-Lechkhumi-Kvemo Svaneti",
    name_ka: 'რაჭა-ლეჩხუმი და ქვემო სვანეთი',
    wd_code: 'GE-RL',
  },
  'GE-SJ': {
    svg_id: 'GE-SJ',
    name_en: 'Samtskhe-Javakheti',
    name_ka: 'სამცხე-ჯავახეთი',
    wd_code: 'GE-SJ',
  },
  'GE-SK': { svg_id: 'GE-SK', name_en: 'Shida Kartli', name_ka: 'შიდა ქართლი', wd_code: 'GE-SK' },
  'GE-SZ': {
    svg_id: 'GE-SZ',
    name_en: 'Samegrelo-Zemo Svaneti',
    name_ka: 'სამეგრელო-ზემო სვანეთი',
    wd_code: 'GE-SZ',
  },
  'GE-TB': { svg_id: 'GE-TB', name_en: 'Tbilisi', name_ka: 'თბილისი', wd_code: 'GE-TB' },
};

type GelPerUsd = Record<number, number>;

async function fetchGelPerUsd(years: number[]): Promise<GelPerUsd> {
  const minY = Math.min(...years);
  const maxY = Math.max(...years);
  const url = `${WB_GEL_FX}&date=${minY - 1}:${maxY + 1}&per_page=20`;
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`World Bank GEL/USD: HTTP ${res.status}`);
  const j = (await res.json()) as [unknown, Array<{ date: string; value: number | null }>];
  const rows = Array.isArray(j) ? j[1] : [];
  const result: GelPerUsd = {};
  for (const row of rows) {
    const y = Number(row.date);
    if (Number.isFinite(y) && row.value != null) result[y] = Number(row.value);
  }
  return result;
}

type WdRegion = { svg_id: string; pop: number; area: number; en: string; ka: string };

async function fetchWikidataRegions(): Promise<Map<string, WdRegion>> {
  const codes = Object.keys(GEO_REGION_MAP)
    .map((c) => `"${c}"`)
    .join(' ');
  const q = `
SELECT ?code ?pop ?area (SAMPLE(?en) AS ?en) (SAMPLE(?ka) AS ?ka) WHERE {
  VALUES ?code { ${codes} }
  ?item wdt:P300 ?code .
  ?item wdt:P17 wd:Q230 .
  OPTIONAL { ?item wdt:P1082 ?pop . }
  OPTIONAL { ?item wdt:P2046 ?area . }
  ?item rdfs:label ?en . FILTER (lang(?en) = "en")
  OPTIONAL { ?item rdfs:label ?ka . FILTER (lang(?ka) = "ka") }
} GROUP BY ?code ?pop ?area
`.trim();

  const res = await fetch(WD_ENDPOINT, {
    method: 'POST',
    headers: {
      ...UA,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ query: q, format: 'json' }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Wikidata: ${res.status}`);
  const j = (await res.json()) as {
    results: { bindings: Array<Record<string, { value: string }>> };
  };
  const out = new Map<string, WdRegion>();
  for (const b of j.results?.bindings ?? []) {
    const code = b['code']!.value;
    out.set(code, {
      svg_id: code,
      pop: b['pop'] ? Number(b['pop'].value) : NaN,
      area: b['area'] ? Number(b['area'].value) : NaN,
      en: b['en']?.value ?? code,
      ka: b['ka']?.value ?? '',
    });
  }
  return out;
}

/**
 * Renders geostat.ge via Playwright (it's a JavaScript SPA — raw fetch returns only a shell).
 * Extracts the GRP-by-region table and returns a map: regionName → (year → grpMillionGel).
 */
async function fetchGeostatGrpTable(): Promise<Map<string, Map<number, number>>> {
  const browser = await chromium.launch({ headless: true });
  let tableData: Array<{ cells: string[] }>;
  try {
    const page = await browser.newPage();
    await page.goto(GEOSTAT_GRP_URL, { waitUntil: 'networkidle', timeout: 60_000 });

    // Wait for a data table to appear
    await page.waitForSelector('table', { timeout: 20_000 }).catch(() => {
      throw new Error(
        'geostat.ge: no <table> found after page load.\n' +
          `Please update marketing/assets/georgia/data.csv manually from:\n  ${GEOSTAT_GRP_URL}`,
      );
    });

    // Extract all tables and pick the one with year columns
    tableData = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll('table'));
      for (const table of tables) {
        const rows = Array.from(table.querySelectorAll('tr'));
        const result: Array<{ cells: string[] }> = [];
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('th, td')).map((el) =>
            (el as HTMLElement).innerText.trim(),
          );
          if (cells.length > 1) result.push({ cells });
        }
        // A GRP table will have at least one cell containing a 4-digit year
        const hasYear = result.some((r) => r.cells.some((c) => /^\d{4}$/.test(c.trim())));
        if (hasYear) return result;
      }
      return [];
    });
  } finally {
    await browser.close();
  }

  if (tableData.length === 0) {
    throw new Error(
      'geostat.ge: no table with year columns found on the page.\n' +
        `Please update marketing/assets/georgia/data.csv manually from:\n  ${GEOSTAT_GRP_URL}`,
    );
  }

  // Find the header row (the one containing year numbers)
  const headerRowIdx = tableData.findIndex((r) => r.cells.some((c) => /^\d{4}$/.test(c.trim())));
  const headerRow = tableData[headerRowIdx]!;
  const years: number[] = [];
  const yearColIndices: number[] = [];
  headerRow.cells.forEach((cell, i) => {
    if (/^\d{4}$/.test(cell.trim())) {
      years.push(Number(cell.trim()));
      yearColIndices.push(i);
    }
  });

  const result = new Map<string, Map<number, number>>();
  for (const row of tableData.slice(headerRowIdx + 1)) {
    const regionName = row.cells[0]?.trim() ?? '';
    if (!regionName || /^total$|georgia|საქართველო/i.test(regionName)) continue;

    const yearMap = new Map<number, number>();
    for (let j = 0; j < yearColIndices.length; j++) {
      const raw = row.cells[yearColIndices[j]!]?.replace(/\s/g, '').replace(',', '.');
      const val = raw ? Number(raw) : NaN;
      if (Number.isFinite(val) && val > 0) yearMap.set(years[j]!, val);
    }
    if (yearMap.size > 0) result.set(regionName, yearMap);
  }

  if (result.size === 0) {
    throw new Error('geostat.ge: table found but no data rows parsed. Check the page structure.');
  }
  return result;
}

function normGeo(s: string): string {
  return s.toLowerCase().replace(/['']/g, "'").replace(/\s+/g, ' ').trim();
}

function matchRegionName(
  name: string,
  grpTable: Map<string, Map<number, number>>,
): Map<number, number> | null {
  const n = normGeo(name);
  for (const [key, val] of grpTable.entries()) {
    if (normGeo(key) === n) return val;
    if (normGeo(key).includes(n) || n.includes(normGeo(key))) return val;
  }
  return null;
}

function csvLine(fields: (string | number)[]): string {
  return (
    fields
      .map((f) => {
        const s = String(f);
        return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(',') + '\n'
  );
}

type PanelFetchContext = {
  slug: string;
  meta: Record<string, unknown> & { dataset_year?: string };
  assetsRoot: string;
  marketingRoot: string;
  countryDir: string;
};

export default async function runGeorgia(ctx: PanelFetchContext): Promise<void> {
  const preferredYear = Number(ctx.meta.dataset_year ?? 2025);
  const years = Array.from({ length: 5 }, (_, i) => preferredYear - 4 + i);

  console.log(
    `  (georgia: fetching GRP per region for years ${years[0]}–${years[years.length - 1]})`,
  );
  console.log(`  Primary source: Geostat (${GEOSTAT_GRP_URL})`);

  const [grpTable, wdRegions, gelRates] = await Promise.all([
    fetchGeostatGrpTable(),
    fetchWikidataRegions(),
    fetchGelPerUsd(years),
  ]);

  let out = DATA_CSV_HEADER + '\n';
  const missing: string[] = [];

  for (const region of Object.values(GEO_REGION_MAP)) {
    const wd = wdRegions.get(region.svg_id);
    const pop = wd?.pop ?? NaN;
    const area = wd?.area ?? NaN;
    const grpYearMap =
      matchRegionName(region.name_en, grpTable) ?? matchRegionName(region.name_ka, grpTable);

    for (const yr of years) {
      const grpGelMillion = grpYearMap?.get(yr);
      const gelPerUsd = gelRates[yr];
      let gdpPerCapita: number | '' = '';

      if (grpGelMillion != null && gelPerUsd != null && Number.isFinite(pop) && pop > 0) {
        gdpPerCapita = Math.round(((grpGelMillion * 1e6) / gelPerUsd / pop) * 100) / 100;
      } else {
        missing.push(`${region.svg_id}/${yr}`);
      }

      out += csvLine([
        region.name_en,
        region.name_ka,
        region.svg_id,
        yr,
        Number.isFinite(pop) ? Math.round(pop) : '',
        Number.isFinite(area) ? Math.round(area) : '',
        gdpPerCapita,
      ]);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `  Warning: no GRP data for ${missing.length} (region, year) pair(s): ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`,
    );
  }

  const dataPath = join(ctx.countryDir, 'data.csv');
  writeFileSync(dataPath, out);
  console.log(
    `  ✓ data.csv written (${Object.keys(GEO_REGION_MAP).length} regions × ${years.length} years)`,
  );

  const sourcesPath = join(ctx.countryDir, 'sources.json');
  writeFileSync(
    sourcesPath,
    JSON.stringify(
      {
        subnational: {
          grp_per_region: {
            source: 'National Statistics Office of Georgia (Geostat)',
            url: GEOSTAT_GRP_URL,
            note: 'Gross Regional Product (million GEL), converted to USD via World Bank PA.NUS.FCRF.',
            last_fetched: new Date().toISOString(),
          },
        },
        world_bank: { indicator_fx: 'PA.NUS.FCRF (GEL per USD)', rates: gelRates },
        wikidata: { note: 'Population (P1082) and area km² (P2046) for ISO-3166-2 GEO codes.' },
      },
      null,
      2,
    ),
  );
}
