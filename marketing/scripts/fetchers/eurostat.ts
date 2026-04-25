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
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_CSV_HEADER } from '../lib/marketingDataCsv.ts';

// JSON-stat 2.0 endpoint — respects geo/time filters, compact response
const EUROSTAT_STATS_URL =
  'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nama_10r_2gdp';
// ECB Data Portal — annual average USD per EUR exchange rate
const ECB_EURUSD_URL =
  'https://data-api.ecb.europa.eu/service/data/EXR/A.USD.EUR.SP00.A?format=jsondata&detail=dataonly';
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
// Eurostat JSON-stat 2.0 — properly filtered, compact response
// ---------------------------------------------------------------------------

type EurostatJsonStat = {
  id: string[];
  size: number[];
  dimension: {
    geo: { category: { index: Record<string, number>; label: Record<string, string> } };
    time: { category: { index: Record<string, number>; label: Record<string, string> } };
  };
  value: Record<string, number | null>;
};

async function fetchEurostatStats(
  nutsCodes: string[],
  years: number[],
): Promise<Map<string, Map<number, number>>> {
  // Each geo and time must be a separate query parameter for proper filtering
  const params = new URLSearchParams({ unit: 'EUR_HAB', lang: 'EN' });
  for (const code of nutsCodes) params.append('geo', code);
  for (const yr of years) params.append('time', String(yr));

  const url = `${EUROSTAT_STATS_URL}?${params.toString()}`;
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Eurostat: HTTP ${res.status} — ${await res.text()}`);

  const d = (await res.json()) as EurostatJsonStat;
  const geoIndex = d.dimension.geo.category.index; // NUTS code → 0-based position
  const timeIndex = d.dimension.time.category.index; // year string → 0-based position
  const numTimes = d.size[d.id.indexOf('time')] ?? years.length;

  const result = new Map<string, Map<number, number>>();
  for (const [nutsCode, geoPos] of Object.entries(geoIndex)) {
    const yearMap = new Map<number, number>();
    for (const [yearStr, timePos] of Object.entries(timeIndex)) {
      const flatIdx = geoPos * numTimes + timePos;
      const val = d.value[String(flatIdx)];
      if (val != null && Number.isFinite(val) && val > 0) {
        yearMap.set(Number(yearStr), val);
      }
    }
    if (yearMap.size > 0) result.set(nutsCode, yearMap);
  }
  return result;
}

// ---------------------------------------------------------------------------
// World Bank FX (local currency per USD)
// ---------------------------------------------------------------------------

/** Returns annual average USD per 1 EUR from the ECB Data Portal. */
async function fetchUsdPerEur(years: number[]): Promise<Record<number, number>> {
  const minY = Math.min(...years);
  const maxY = Math.max(...years);
  const url = `${ECB_EURUSD_URL}&startPeriod=${minY - 1}&endPeriod=${maxY + 1}`;
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`ECB FX: HTTP ${res.status}`);
  type EcbJson = {
    structure: {
      dimensions: { observation: Array<{ id: string; values: Array<{ id: string }> }> };
    };
    dataSets: Array<{ series: Record<string, { observations: Record<string, [number]> }> }>;
  };
  const d = (await res.json()) as EcbJson;
  const timeDim = d.structure.dimensions.observation.find((dim) => dim.id === 'TIME_PERIOD');
  const timeValues = timeDim?.values ?? [];
  const series = Object.values(d.dataSets[0]?.series ?? {})[0];
  const obs = series?.observations ?? {};
  const result: Record<number, number> = {};
  for (const [idxStr, val] of Object.entries(obs)) {
    const yearStr = timeValues[Number(idxStr)]?.id;
    if (yearStr && val[0] != null) result[Number(yearStr)] = val[0];
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

  const [eurostatData, usdPerEurRates, wdRegions] = await Promise.all([
    fetchEurostatStats(nutsCodes, years),
    fetchUsdPerEur(years),
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
      const lcuPerUsd = usdPerEurRates[yr];

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
          url: `${EUROSTAT_STATS_URL}?geo=${nutsCodes.join('&geo=')}&unit=EUR_HAB`,
          last_fetched: new Date().toISOString(),
        },
        world_bank: { indicator_fx: `PA.NUS.FCRF (${wbCode})`, rates: usdPerEurRates },
        wikidata: { note: 'Population and area via ISO-3166-2 codes.' },
      },
      null,
      2,
    ),
  );
}
