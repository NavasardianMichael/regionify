/**
 * Armenia panel fetcher — GDP per capita (USD) per marz, 5 years.
 *
 * Source priority:
 *   1. armstat.am National Statistical Database (GDP by marz, AMD)
 *   2. World Bank USD/AMD FX rate for conversion
 *   3. Wikidata for population + area (cross-referenced with official census)
 *
 * If a specific (marz, year) value cannot be fetched it is omitted (no empty row).
 * If the entire armstat.am fetch fails the script exits with instructions for manual update.
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_CSV_HEADER } from '../lib/marketingDataCsv.ts';

const WD_ENDPOINT = 'https://query.wikidata.org/sparql';
const WB_AMD_FX = 'https://api.worldbank.org/v2/country/ARM/indicator/PA.NUS.FCRF?format=json';

// armstat.am publishes regional GDP (gross value added by marz) in AMD million.
// The public statistical database is accessible at the URL below.
// Category code 220 = "Gross Regional Product by Marzes of RA"
const ARMSTAT_BASE = 'https://www.armstat.am';
const ARMSTAT_DATA_URL = `${ARMSTAT_BASE}/nsdp/?pc=220&lang=2`;

const UA = { 'User-Agent': 'RegionifyMarketing/1.0 (panel fetch; contact: regionify.pro)' };

// ISO 3166-2 codes for Armenia's 11 marzes (+ Yerevan city)
// Maps SVG path id → Armenian/English name used in armstat data
const ARM_MARZ_MAP: Record<
  string,
  { svg_id: string; name_en: string; name_hy: string; wd_code: string }
> = {
  'AM-ER': { svg_id: 'AM-ER', name_en: 'Yerevan', name_hy: 'Երևան', wd_code: 'AM-ER' },
  'AM-AG': { svg_id: 'AM-AG', name_en: 'Aragatsotn', name_hy: 'Արագածոտն', wd_code: 'AM-AG' },
  'AM-AR': { svg_id: 'AM-AR', name_en: 'Ararat', name_hy: 'Արարատ', wd_code: 'AM-AR' },
  'AM-AV': { svg_id: 'AM-AV', name_en: 'Armavir', name_hy: 'Արմավիր', wd_code: 'AM-AV' },
  'AM-GR': { svg_id: 'AM-GR', name_en: 'Gegharkunik', name_hy: 'Գեղարքունիք', wd_code: 'AM-GR' },
  'AM-KT': { svg_id: 'AM-KT', name_en: 'Kotayk', name_hy: 'Կոտայք', wd_code: 'AM-KT' },
  'AM-LO': { svg_id: 'AM-LO', name_en: 'Lori', name_hy: 'Լոռի', wd_code: 'AM-LO' },
  'AM-SH': { svg_id: 'AM-SH', name_en: 'Shirak', name_hy: 'Շիրակ', wd_code: 'AM-SH' },
  'AM-SU': { svg_id: 'AM-SU', name_en: 'Syunik', name_hy: 'Սյունիք', wd_code: 'AM-SU' },
  'AM-TV': { svg_id: 'AM-TV', name_en: 'Tavush', name_hy: 'Տավուշ', wd_code: 'AM-TV' },
  'AM-VD': { svg_id: 'AM-VD', name_en: 'Vayots Dzor', name_hy: 'Վայոց Ձոր', wd_code: 'AM-VD' },
};

type AmdPerUsd = Record<number, number>;

async function fetchAmdPerUsd(years: number[]): Promise<AmdPerUsd> {
  const minY = Math.min(...years);
  const maxY = Math.max(...years);
  const url = `${WB_AMD_FX}&date=${minY - 1}:${maxY + 1}&per_page=20`;
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`World Bank AMD/USD: HTTP ${res.status}`);
  const j = (await res.json()) as [unknown, Array<{ date: string; value: number | null }>];
  const rows = Array.isArray(j) ? j[1] : [];
  const result: AmdPerUsd = {};
  for (const row of rows) {
    const y = Number(row.date);
    if (Number.isFinite(y) && row.value != null) result[y] = Number(row.value);
  }
  return result;
}

type WdMarz = { svg_id: string; pop: number; area: number; en: string; hy: string };

async function fetchWikidataMarzes(): Promise<Map<string, WdMarz>> {
  const codes = Object.keys(ARM_MARZ_MAP)
    .map((c) => `"${c}"`)
    .join(' ');
  const q = `
SELECT ?code ?pop ?area (SAMPLE(?en) AS ?en) (SAMPLE(?hy) AS ?hy) WHERE {
  VALUES ?code { ${codes} }
  ?item wdt:P300 ?code .
  ?item wdt:P17 wd:Q399 .
  OPTIONAL { ?item wdt:P1082 ?pop . }
  OPTIONAL { ?item wdt:P2046 ?area . }
  ?item rdfs:label ?en . FILTER (lang(?en) = "en")
  OPTIONAL { ?item rdfs:label ?hy . FILTER (lang(?hy) = "hy") }
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
  const out = new Map<string, WdMarz>();
  for (const b of j.results?.bindings ?? []) {
    const code = b['code']!.value;
    out.set(code, {
      svg_id: code,
      pop: b['pop'] ? Number(b['pop'].value) : NaN,
      area: b['area'] ? Number(b['area'].value) : NaN,
      en: b['en']?.value ?? code,
      hy: b['hy']?.value ?? '',
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// armstat.am — scrape Gross Regional Product table
// Returns: Map<marz_name_en, Map<year, gdp_amd_million>>
// ---------------------------------------------------------------------------

async function fetchArmstatGrpTable(): Promise<Map<string, Map<number, number>>> {
  // armstat.am NSDP data table for Gross Regional Product by marz (category 220)
  // The table is rendered as HTML with columns for each year
  let html: string;
  try {
    const res = await fetch(ARMSTAT_DATA_URL, {
      headers: { ...UA, Accept: 'text/html' },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (err) {
    throw new Error(
      `armstat.am fetch failed: ${String(err)}\n` +
        `Please update marketing/assets/armenia/data.csv manually from:\n` +
        `  ${ARMSTAT_DATA_URL}\n` +
        `  or https://www.armstat.am/en/category/categories/1204`,
    );
  }

  // Parse year headers from the table header row
  const yearMatches = [...html.matchAll(/<th[^>]*>(\d{4})<\/th>/gi)];
  const years = yearMatches.map((m) => Number(m[1]));
  if (years.length === 0) {
    throw new Error(
      'armstat.am: could not parse year columns from GRP table.\n' +
        'The page structure may have changed. Please update data.csv manually.',
    );
  }

  // Parse data rows: each row has a marz name and numeric values per year
  const result = new Map<string, Map<number, number>>();

  // Match table rows containing marz name and data cells
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(html)) !== null) {
    const rowHtml = rowMatch[1]!;
    // Extract text content of cells
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      m[1]!
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim(),
    );
    if (cells.length < 2) continue;
    const marzName = cells[0]!.trim();
    if (!marzName || /total|ընդամենը|^armenia/i.test(marzName)) continue;

    const yearMap = new Map<number, number>();
    for (let i = 0; i < years.length; i++) {
      const raw = cells[i + 1]?.replace(/\s/g, '').replace(',', '.');
      const val = raw ? Number(raw) : NaN;
      if (Number.isFinite(val) && val > 0) yearMap.set(years[i]!, val);
    }
    if (yearMap.size > 0) result.set(marzName, yearMap);
  }

  if (result.size === 0) {
    throw new Error(
      'armstat.am: no data rows parsed from GRP table. Page structure may have changed.',
    );
  }
  return result;
}

function normArm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function matchMarzName(
  name: string,
  grpTable: Map<string, Map<number, number>>,
): Map<number, number> | null {
  const n = normArm(name);
  for (const [key, val] of grpTable.entries()) {
    if (normArm(key) === n) return val;
    if (normArm(key).includes(n) || n.includes(normArm(key))) return val;
  }
  return null;
}

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

type PanelFetchContext = {
  slug: string;
  meta: Record<string, unknown> & { dataset_year?: string };
  assetsRoot: string;
  marketingRoot: string;
  countryDir: string;
};

export default async function runArmenia(ctx: PanelFetchContext): Promise<void> {
  const preferredYear = Number(ctx.meta.dataset_year ?? 2025);
  const years = Array.from({ length: 5 }, (_, i) => preferredYear - 4 + i); // e.g. 2021-2025

  console.log(
    `  (armenia: fetching GDP per marz for years ${years[0]}–${years[years.length - 1]})`,
  );
  console.log(`  Primary source: armstat.am (${ARMSTAT_DATA_URL})`);

  const [grpTable, wdMarzes, amdRates] = await Promise.all([
    fetchArmstatGrpTable(),
    fetchWikidataMarzes(),
    fetchAmdPerUsd(years),
  ]);

  let out = DATA_CSV_HEADER + '\n';
  const missing: string[] = [];

  for (const marz of Object.values(ARM_MARZ_MAP)) {
    const wd = wdMarzes.get(marz.svg_id);
    const pop = wd?.pop ?? NaN;
    const area = wd?.area ?? NaN;
    const grpYearMap =
      matchMarzName(marz.name_en, grpTable) ?? matchMarzName(marz.name_hy, grpTable);

    for (const yr of years) {
      const grpAmdMillion = grpYearMap?.get(yr);
      const amdPerUsd = amdRates[yr];
      let gdpPerCapita: number | '' = '';

      if (grpAmdMillion != null && amdPerUsd != null && Number.isFinite(pop) && pop > 0) {
        gdpPerCapita = Math.round(((grpAmdMillion * 1e6) / amdPerUsd / pop) * 100) / 100;
      } else {
        missing.push(`${marz.svg_id}/${yr}`);
      }

      out += csvLine([
        marz.name_en,
        marz.name_hy,
        marz.svg_id,
        yr,
        Number.isFinite(pop) ? Math.round(pop) : '',
        Number.isFinite(area) ? Math.round(area) : '',
        gdpPerCapita,
      ]);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `  Warning: no GDP data for ${missing.length} (marz, year) pair(s): ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`,
    );
  }

  const dataPath = join(ctx.countryDir, 'data.csv');
  writeFileSync(dataPath, out);
  console.log(
    `  ✓ data.csv written (${Object.keys(ARM_MARZ_MAP).length} marzes × ${years.length} years)`,
  );

  // Update sources.json
  const sourcesPath = join(ctx.countryDir, 'sources.json');
  const sources = {
    subnational: {
      gdp_per_marz: {
        source: 'Armenian Statistical Service (armstat.am)',
        url: ARMSTAT_DATA_URL,
        note: 'Gross Regional Product by marz (AMD million), converted to USD via World Bank PA.NUS.FCRF.',
        years: years.filter((yr) => years.includes(yr)),
        last_fetched: new Date().toISOString(),
      },
    },
    world_bank: {
      indicator_fx: 'PA.NUS.FCRF (AMD per USD, official exchange rate)',
      rates: amdRates,
    },
    wikidata: {
      note: 'Population (P1082) and area km² (P2046) for ISO-3166-2 ARM codes (P300). Links to official census data.',
    },
  };
  writeFileSync(sourcesPath, JSON.stringify(sources, null, 2));
}
