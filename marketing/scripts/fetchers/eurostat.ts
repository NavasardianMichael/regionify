/**
 * Generic Eurostat NUTS regional GDP per capita fetcher.
 *
 * Works for any EU/EEA country. Configuration in meta.json:
 *
 *   "panel_fetcher": "eurostat",
 *   "eurostat_nuts_codes": ["FR1", "FRB", ...],   // NUTS codes to fetch
 *   "eurostat_nuts_to_svg": { "FR1": "FR-IDF", "FRB": "FR-CVL", ... }
 *
 * Sources:
 *   - GDP per capita (EUR_HAB): Eurostat nama_10r_2gdp TSV API
 *   - EUR→USD: World Bank PA.NUS.FCRF for the country
 *   - Population + area: Wikidata SPARQL (ISO-3166-2 codes from SVG)
 *
 * Dataset: https://ec.europa.eu/eurostat/databrowser/view/NAMA_10R_2GDP
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_CSV_HEADER } from '../lib/marketingDataCsv.ts';

const EUROSTAT_TSV_URL =
  'https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/nama_10r_2gdp';
const WB_FX_BASE = 'https://api.worldbank.org/v2/country';
const WD_ENDPOINT = 'https://query.wikidata.org/sparql';

const UA = { 'User-Agent': 'RegionifyMarketing/1.0 (panel fetch; contact: regionify.pro)' };

type MetaConfig = {
  slug: string;
  dataset_year?: string;
  wb_country_code?: string; // World Bank 3-letter code for FX (e.g. "FRA"); defaults to slug
  eurostat_nuts_codes?: string[]; // NUTS-1/2 codes to fetch (e.g. ["FR1","FRB",...])
  eurostat_nuts_to_svg?: Record<string, string>; // NUTS code → SVG path id (e.g. {"FR1":"FR-IDF"})
  [key: string]: unknown;
};

// ---------------------------------------------------------------------------
// Eurostat TSV
// ---------------------------------------------------------------------------

async function fetchEurostatTsv(
  nutsCodes: string[],
  years: number[],
): Promise<Map<string, Map<number, number>>> {
  const geoParam = nutsCodes.join(',');
  const timeParam = years.join(',');
  const url = `${EUROSTAT_TSV_URL}?geo=${geoParam}&unit=EUR_HAB&time=${timeParam}&format=TSV`;

  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Eurostat TSV: HTTP ${res.status}`);
  const text = await res.text();

  const lines = text.split('\n').filter(Boolean);
  if (lines.length < 2) throw new Error('Eurostat TSV: empty response');

  // Header: "freq,unit,geo\TIME_PERIOD\t2019 \t2020 \t..."
  const headerCols = lines[0]!.split('\t');
  const yearCols: number[] = [];
  const yearColIdx: number[] = [];
  headerCols.forEach((col, i) => {
    if (i === 0) return; // skip the key column
    const y = Number(col.trim());
    if (Number.isFinite(y) && y > 1990) {
      yearCols.push(y);
      yearColIdx.push(i);
    }
  });

  const result = new Map<string, Map<number, number>>();
  for (const line of lines.slice(1)) {
    const cols = line.split('\t');
    const key = cols[0]?.trim() ?? '';
    // key is "A,EUR_HAB,GEO_CODE"
    const geoCode = key.split(',').pop()?.trim() ?? '';
    if (!geoCode || !nutsCodes.includes(geoCode)) continue;

    const yearMap = new Map<number, number>();
    for (let j = 0; j < yearColIdx.length; j++) {
      const rawVal = cols[yearColIdx[j]!]?.trim().replace(/[^0-9.]/g, '');
      const val = rawVal ? Number(rawVal) : NaN;
      if (Number.isFinite(val) && val > 0) {
        yearMap.set(yearCols[j]!, val);
      }
    }
    if (yearMap.size > 0) result.set(geoCode, yearMap);
  }
  return result;
}

// ---------------------------------------------------------------------------
// World Bank FX (local currency per USD)
// ---------------------------------------------------------------------------

async function fetchLcuPerUsd(
  wbCountryCode: string,
  years: number[],
): Promise<Record<number, number>> {
  const minY = Math.min(...years);
  const maxY = Math.max(...years);
  const url = `${WB_FX_BASE}/${wbCountryCode}/indicator/PA.NUS.FCRF?format=json&date=${minY - 1}:${maxY + 1}&per_page=20`;
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`World Bank FX (${wbCountryCode}): HTTP ${res.status}`);
  const j = (await res.json()) as [unknown, Array<{ date: string; value: number | null }>];
  const rows = Array.isArray(j) ? j[1] : [];
  const result: Record<number, number> = {};
  for (const row of rows) {
    const y = Number(row.date);
    if (Number.isFinite(y) && row.value != null) result[y] = Number(row.value);
  }
  // Eurozone countries: PA.NUS.FCRF returns EUR/USD for the euro area
  // If no values returned (e.g. country uses EUR natively), try "EMU"
  if (Object.keys(result).length === 0) {
    console.warn(`  FX: no PA.NUS.FCRF for ${wbCountryCode}, falling back to EMU`);
    const fallback = await fetchLcuPerUsd('EMU', years);
    return fallback;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Wikidata population + area (by ISO-3166-2 SVG id)
// ---------------------------------------------------------------------------

type WdRegion = { svg_id: string; pop: number; area: number; en: string; local: string };

async function fetchWikidataByIsoCodes(
  svgIds: string[],
  countryQid: string, // e.g. "Q142" for France
): Promise<Map<string, WdRegion>> {
  const values = svgIds.map((c) => `"${c}"`).join(' ');
  const q = `
SELECT ?code ?pop ?area (SAMPLE(?en) AS ?en) (SAMPLE(?local) AS ?local) WHERE {
  VALUES ?code { ${values} }
  ?item wdt:P300 ?code .
  ?item wdt:P17 wd:${countryQid} .
  OPTIONAL { ?item wdt:P1082 ?pop . }
  OPTIONAL { ?item wdt:P2046 ?area . }
  ?item rdfs:label ?en . FILTER (lang(?en) = "en")
  OPTIONAL { ?item rdfs:label ?local . FILTER (lang(?local) = "fr") }
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
      local: b['local']?.value ?? '',
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// SVG id extraction (to get the list of region codes in the map)
// ---------------------------------------------------------------------------

function extractSvgIds(mapFilePath: string): string[] {
  const raw = readFileSync(mapFilePath, 'utf-8');
  const ids: string[] = [];
  const re = /\bid="([A-Z]{2}-[A-Z0-9]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) ids.push(m[1]!);
  return [...new Set(ids)];
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
  meta: MetaConfig;
  assetsRoot: string;
  marketingRoot: string;
  countryDir: string;
};

export default async function runEurostat(ctx: PanelFetchContext): Promise<void> {
  const meta = ctx.meta;
  const preferredYear = Number(meta.dataset_year ?? 2025);
  const years = Array.from({ length: 5 }, (_, i) => preferredYear - 4 + i);

  const nutsCodes = meta.eurostat_nuts_codes;
  const nutsToSvg = meta.eurostat_nuts_to_svg;
  if (!nutsCodes || nutsCodes.length === 0) {
    throw new Error(`meta.json for "${ctx.slug}" must include "eurostat_nuts_codes" array.`);
  }
  if (!nutsToSvg || Object.keys(nutsToSvg).length === 0) {
    throw new Error(`meta.json for "${ctx.slug}" must include "eurostat_nuts_to_svg" mapping.`);
  }

  const wbCode = (meta.wb_country_code as string | undefined) ?? ctx.slug.toUpperCase();
  const wdQid = (meta.wikidata_country_qid as string | undefined) ?? '';
  const svgIds = Object.values(nutsToSvg);

  console.log(
    `  (eurostat: fetching GDP per capita for ${nutsCodes.length} NUTS regions, years ${years[0]}–${years[years.length - 1]})`,
  );
  console.log(`  Source: Eurostat nama_10r_2gdp (EUR_HAB) + World Bank FX (${wbCode})`);

  const [eurostatData, fxRates, wdRegions] = await Promise.all([
    fetchEurostatTsv(nutsCodes, years),
    fetchLcuPerUsd(wbCode, years),
    wdQid ? fetchWikidataByIsoCodes(svgIds, wdQid) : Promise.resolve(new Map<string, WdRegion>()),
  ]);

  const missingFx: number[] = [];
  const missingData: string[] = [];

  let out = DATA_CSV_HEADER + '\n';

  for (const [nutsCode, svgId] of Object.entries(nutsToSvg)) {
    const wd = wdRegions.get(svgId);
    const nameEn = wd?.en ?? svgId;
    const nameLocal = wd?.local ?? '';
    const pop = wd?.pop ?? NaN;
    const area = wd?.area ?? NaN;

    const nutsYearMap = eurostatData.get(nutsCode);

    for (const yr of years) {
      const eurPerCapita = nutsYearMap?.get(yr);
      const lcuPerUsd = fxRates[yr];

      let gdpUsd: number | '' = '';
      if (eurPerCapita != null && lcuPerUsd != null && lcuPerUsd > 0) {
        // EUR_HAB is in EUR; PA.NUS.FCRF is EUR per USD for euro-area countries
        gdpUsd = Math.round((eurPerCapita / lcuPerUsd) * 100) / 100;
      } else {
        if (lcuPerUsd == null) missingFx.push(yr);
        if (eurPerCapita == null) missingData.push(`${nutsCode}/${yr}`);
      }

      out += csvLine([
        nameEn,
        nameLocal,
        svgId,
        yr,
        Number.isFinite(pop) ? Math.round(pop) : '',
        Number.isFinite(area) ? Math.round(area) : '',
        gdpUsd,
      ]);
    }
  }

  if (missingData.length > 0) {
    console.warn(
      `  Warning: no Eurostat data for ${missingData.length} (region, year) pair(s): ${missingData.slice(0, 5).join(', ')}${missingData.length > 5 ? '...' : ''}`,
    );
  }

  const dataPath = join(ctx.countryDir, 'data.csv');
  writeFileSync(dataPath, out);
  console.log(`  ✓ data.csv written (${nutsCodes.length} regions × ${years.length} years)`);

  const sourcesPath = join(ctx.countryDir, 'sources.json');
  writeFileSync(
    sourcesPath,
    JSON.stringify(
      {
        eurostat: {
          dataset: 'nama_10r_2gdp',
          unit: 'EUR_HAB (GDP per capita in EUR)',
          url: `${EUROSTAT_TSV_URL}?geo=${nutsCodes.join(',')}&unit=EUR_HAB`,
          last_fetched: new Date().toISOString(),
        },
        world_bank: { indicator_fx: `PA.NUS.FCRF (${wbCode})`, rates: fxRates },
        wikidata: { note: 'Population and area via ISO-3166-2 codes.' },
      },
      null,
      2,
    ),
  );
}
