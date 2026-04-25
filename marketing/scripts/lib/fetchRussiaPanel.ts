/**
 * Fetches Russia federal-subject panel data from trusted primary sources:
 *   - GRP (nominal, billion RUB): Rosstat official statistics (rosstat.gov.ru)
 *   - USD FX rate: World Bank PA.NUS.FCRF
 *   - Population, area: Wikidata SPARQL (links to official census / Rosstat)
 *
 * Falls back gracefully: regions / years with no data are omitted or marked empty.
 */
import { readFileSync } from 'node:fs';

const WD_ENDPOINT = 'https://query.wikidata.org/sparql';
const WB_FX_URL = 'https://api.worldbank.org/v2/country/RUS/indicator/PA.NUS.FCRF?format=json';

// Rosstat open-data endpoint for GRP by federal subject (billion RUB)
// Table 1.6 "Gross regional product by constituent entities of the Russian Federation"
// Source: https://rosstat.gov.ru/storage/mediabank/VVP_sub_2023.xlsx (annual Excel release)
// The JSON endpoint below is the machine-readable version served by the Rosstat API.
const ROSSTAT_GRP_API =
  'https://fedstat.ru/indicator/data.do?id=31452&filter=s1702.all.all&format=json';

const UA = { 'User-Agent': 'RegionifyMarketing/1.0 (panel fetch; contact: regionify.pro)' };

export type RussiaRow = {
  svg_id: string;
  year: number;
  name_en: string;
  name_local: string;
  population: number;
  area_km2: number;
  gdp_per_capita: number;
};

export type PanelReport = {
  years: number[];
  rub_per_usd: Record<number, number>;
  source_grp: string;
  missing_grp: string[];
  missing_wd: string[];
};

// ---------------------------------------------------------------------------
// Rosstat GRP fetch
// ---------------------------------------------------------------------------

type RosstatEntry = { regionCode: string; regionName: string; year: number; grpBillionRub: number };

/**
 * Fetches GRP data from Rosstat fedstat API.
 * Returns entries for all available years and regions.
 * On failure, throws so the caller can decide whether to skip or abort.
 */
async function fetchRosstatGrpEntries(): Promise<RosstatEntry[]> {
  let res: Response;
  try {
    res = await fetch(ROSSTAT_GRP_API, {
      headers: { ...UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    throw new Error(`Rosstat network error: ${String(err)}`);
  }
  if (!res.ok) {
    throw new Error(`Rosstat HTTP ${res.status}: ${await res.text()}`);
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new Error('Rosstat: response is not valid JSON');
  }

  const entries: RosstatEntry[] = [];

  // fedstat.ru JSON shape:
  // { rowData: [ { lineValues: [ { value, period, ... } ], title, code } ] }
  const rowData = (body as { rowData?: unknown[] })?.rowData;
  if (!Array.isArray(rowData) || rowData.length === 0) {
    throw new Error('Rosstat: unexpected JSON shape (no rowData)');
  }

  for (const row of rowData) {
    const r = row as {
      title?: string;
      code?: string;
      lineValues?: Array<{ value?: string | number; period?: string }>;
    };
    if (!r.code || !r.title || !Array.isArray(r.lineValues)) continue;
    for (const lv of r.lineValues) {
      if (!lv.period || lv.value == null) continue;
      const year = Number(lv.period);
      const grpBillionRub = Number(String(lv.value).replace(/\s/g, '').replace(',', '.'));
      if (!Number.isFinite(year) || !Number.isFinite(grpBillionRub) || grpBillionRub <= 0) continue;
      entries.push({ regionCode: r.code, regionName: r.title, year, grpBillionRub });
    }
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Rosstat HTML table fallback (rosstat.gov.ru/storage Excel redirects to HTML)
// ---------------------------------------------------------------------------

/**
 * Alternative: scrape the Rosstat VRP table page for the most recent years.
 * Used when the JSON API is unavailable.
 */
async function fetchRosstatGrpHtml(year: number): Promise<Map<string, number>> {
  // We can't parse XLSX directly without a lib; instead use the EMISS open-data portal
  // which republishes Rosstat data in JSON.
  const emissUrl = `https://www.fedstat.ru/indicator/data.do?id=31452&filter=s1702.${year}.all&format=json`;
  const res = await fetch(emissUrl, {
    headers: { ...UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`EMISS/Rosstat ${year}: HTTP ${res.status}`);
  const body = (await res.json()) as {
    rowData?: Array<{
      code?: string;
      title?: string;
      lineValues?: Array<{ value?: unknown; period?: string }>;
    }>;
  };
  const map = new Map<string, number>();
  for (const row of body.rowData ?? []) {
    if (!row.code || !row.title || !Array.isArray(row.lineValues)) continue;
    for (const lv of row.lineValues) {
      if (lv.period !== String(year) || lv.value == null) continue;
      const grp = Number(String(lv.value).replace(/\s/g, '').replace(',', '.'));
      if (Number.isFinite(grp) && grp > 0) map.set(row.title, grp);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// World Bank FX
// ---------------------------------------------------------------------------

async function fetchRubPerUsd(year: number): Promise<number> {
  const url = `${WB_FX_URL}&date=${year - 1}:${year + 1}&per_page=10`;
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`World Bank FX: HTTP ${res.status}`);
  const j = (await res.json()) as [unknown, Array<{ date: string; value: number | null }>];
  const rows = Array.isArray(j) ? j[1] : null;
  if (!Array.isArray(rows)) throw new Error('World Bank: unexpected body');
  for (const row of rows) {
    if (row.date === String(year) && row.value != null) return Number(row.value);
  }
  // fallback to nearest available year
  for (const row of rows) {
    if (row.value != null) return Number(row.value);
  }
  throw new Error(`World Bank: no RUB/USD rate for ${year}`);
}

// ---------------------------------------------------------------------------
// Wikidata population + area
// ---------------------------------------------------------------------------

type WdRegion = {
  code: string;
  pop: number;
  area: number;
  en: string;
  ru: string;
};

async function fetchWikidataByIsoCodes(codes: string[]): Promise<Map<string, WdRegion>> {
  const values = codes.map((c) => `"${c}"`).join(' ');
  const q = `
SELECT ?code ?pop ?area (SAMPLE(?en) AS ?en) (SAMPLE(?ru) AS ?ru) WHERE {
  VALUES ?code { ${values} }
  ?item wdt:P300 ?code .
  ?item wdt:P17 wd:Q159 .
  OPTIONAL { ?item wdt:P1082 ?pop . }
  OPTIONAL { ?item wdt:P2046 ?area . }
  ?item rdfs:label ?en . FILTER (lang(?en) = "en")
  OPTIONAL { ?item rdfs:label ?ru . FILTER (lang(?ru) = "ru") }
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
  if (!res.ok) throw new Error(`Wikidata: ${res.status} ${await res.text()}`);
  const j = (await res.json()) as {
    results: { bindings: Array<Record<string, { value: string }>> };
  };
  const byCode = new Map<string, WdRegion>();
  for (const b of j.results?.bindings ?? []) {
    const code = b['code']!.value;
    byCode.set(code, {
      code,
      pop: b['pop'] != null ? Number(b['pop'].value) : NaN,
      area: b['area'] != null ? Number(b['area'].value) : NaN,
      en: b['en'] != null ? String(b['en'].value) : code,
      ru: b['ru'] != null ? String(b['ru'].value) : '',
    });
  }
  return byCode;
}

// ---------------------------------------------------------------------------
// SVG region extraction
// ---------------------------------------------------------------------------

export function extractRegionsFromMapSvg(mapFilePath: string): { svg_id: string; title: string }[] {
  const raw = readFileSync(mapFilePath, 'utf-8');
  const out: { svg_id: string; title: string }[] = [];
  const re = /<path\s+id="(RU-[^"]+)"\s+title="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    out.push({ svg_id: m[1]!, title: m[2]! });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Name matching: Rosstat Russian name → Wikidata English name
// ---------------------------------------------------------------------------

function norm(s: string): string {
  return s.toLowerCase().replace(/–/g, '-').replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();
}

function normLoose(s: string): string {
  let x = norm(s);
  x = x.replace(/^республика\s+/i, '');
  x = x.replace(/\s+республика$/i, '');
  x = x.replace(/\s+область$/i, '');
  x = x.replace(/\s+край$/i, '');
  x = x.replace(/^г\.\s*/i, '');
  return x.trim();
}

function matchRosstatToWd(rosstatName: string, wdRegions: WdRegion[]): WdRegion | null {
  const nRu = norm(rosstatName);
  const looseRu = normLoose(rosstatName);
  for (const wd of wdRegions) {
    if (norm(wd.ru) === nRu || normLoose(wd.ru) === looseRu) return wd;
  }
  // partial match
  for (const wd of wdRegions) {
    const a = normLoose(wd.ru);
    if (a.length >= 4 && (looseRu.includes(a) || a.includes(looseRu))) return wd;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const PANEL_SOURCE_META = {
  grp: {
    primary: 'https://rosstat.gov.ru (Federal State Statistics Service of Russia)',
    fallback: 'https://fedstat.ru/indicator/31452 (EMISS — Rosstat republication)',
    note: 'Nominal GRP in billion RUB converted to USD via World Bank PA.NUS.FCRF official rate.',
  },
  wikidata: {
    sparql: WD_ENDPOINT,
    note: 'Population (P1082) and area (P2046) in km²; ISO-3166-2 code P300. Wikidata links to official census / Rosstat data.',
  },
  world_bank: { indicator_fx: 'PA.NUS.FCRF' },
};

export async function buildRussiaPanel(opts: {
  mapPath: string;
  years: number[];
}): Promise<{ rows: RussiaRow[]; report: PanelReport }> {
  const { mapPath, years } = opts;
  const regions = extractRegionsFromMapSvg(mapPath);
  const codes = regions.map((r) => r.svg_id);
  if (codes.length === 0) throw new Error('No RU- paths in map SVG');

  // Fetch Wikidata (population/area/names) once for all years
  const wdMap = await fetchWikidataByIsoCodes(codes);
  const wdRegions = [...wdMap.values()];

  // Fetch Rosstat GRP entries (all years at once if possible)
  let allEntries: RosstatEntry[] = [];
  let grpSourceUrl = ROSSTAT_GRP_API;
  try {
    allEntries = await fetchRosstatGrpEntries();
  } catch (e) {
    console.warn(`  Rosstat bulk fetch failed (${String(e)}); trying year-by-year...`);
    grpSourceUrl = 'https://fedstat.ru/indicator/31452';
    for (const yr of years) {
      try {
        const m = await fetchRosstatGrpHtml(yr);
        for (const [name, grp] of m.entries()) {
          allEntries.push({ regionCode: '', regionName: name, year: yr, grpBillionRub: grp });
        }
      } catch (e2) {
        console.warn(`  Rosstat year ${yr} also failed: ${String(e2)}`);
      }
    }
  }

  // Build lookup: (rusName, year) → grpBillionRub
  const grpLookup = new Map<string, Map<number, number>>();
  for (const e of allEntries) {
    if (!grpLookup.has(e.regionName)) grpLookup.set(e.regionName, new Map());
    grpLookup.get(e.regionName)!.set(e.year, e.grpBillionRub);
  }

  // FX rates per year
  const rubPerUsdByYear: Record<number, number> = {};
  for (const yr of years) {
    try {
      rubPerUsdByYear[yr] = await fetchRubPerUsd(yr);
    } catch (e) {
      console.warn(`  FX rate for ${yr}: ${String(e)} — skipping year`);
    }
  }

  const report: PanelReport = {
    years,
    rub_per_usd: rubPerUsdByYear,
    source_grp: grpSourceUrl,
    missing_grp: [],
    missing_wd: [],
  };

  const rows: RussiaRow[] = [];

  for (const { svg_id } of regions) {
    const wd = wdMap.get(svg_id);
    if (!wd || !Number.isFinite(wd.pop) || wd.pop <= 0) {
      report.missing_wd.push(svg_id);
      continue;
    }

    let rosstatName: string | null = null;
    for (const [name] of grpLookup.entries()) {
      const candidate = matchRosstatToWd(name, [wd]);
      if (candidate) {
        rosstatName = name;
        break;
      }
    }

    for (const yr of years) {
      const rubPerUsd = rubPerUsdByYear[yr];
      if (!rubPerUsd) continue;

      let grpBillionRub: number | undefined;
      if (rosstatName) {
        grpBillionRub = grpLookup.get(rosstatName)?.get(yr);
      }
      // Try Russian name directly
      if (grpBillionRub == null && wd.ru) {
        for (const [name, yearMap] of grpLookup.entries()) {
          if (norm(name) === norm(wd.ru) || normLoose(name) === normLoose(wd.ru)) {
            grpBillionRub = yearMap.get(yr);
            rosstatName = name;
            break;
          }
        }
      }

      const gdp_per_capita =
        grpBillionRub != null && grpBillionRub > 0
          ? Math.round(((grpBillionRub * 1e9) / rubPerUsd / wd.pop) * 100) / 100
          : NaN;

      if (grpBillionRub == null) {
        const key = `${svg_id}/${yr}`;
        if (!report.missing_grp.includes(key)) report.missing_grp.push(key);
      }

      rows.push({
        svg_id,
        year: yr,
        name_en: wd.en,
        name_local: wd.ru || '',
        population: Math.round(wd.pop),
        area_km2: Number.isFinite(wd.area) && wd.area > 0 ? wd.area : 0,
        gdp_per_capita,
      });
    }
  }

  rows.sort((a, b) => a.svg_id.localeCompare(b.svg_id) || a.year - b.year);
  return { rows, report };
}
