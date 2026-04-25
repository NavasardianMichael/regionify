/**
 * Single `assets/{slug}/data.csv` in **long** format: one row per region per year.
 *
 *   name_en,name_local,svg_id,year,population,area_km2,value
 *
 * `value` = the choropleth variable (GDP per capita by default; falls back to population
 * when the column is missing or >50% of rows are NaN for the display year).
 */
import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';

export const DATA_CSV_HEADER = 'name_en,name_local,svg_id,year,population,area_km2,value';

export type LongRow = {
  name_en: string;
  name_local: string;
  svg_id: string;
  year: number;
  population: number;
  area_km2: number;
  /** NaN when the source had no data for this (region, year). */
  value: number;
};

type MetaLike = { dataset_year?: string } | null;

export function parseMarketingDataContent(
  content: string,
  meta: MetaLike,
): { longRows: LongRow[]; hasYear: boolean } {
  const raw = parse(content, { columns: true, skip_empty_lines: true, cast: true }) as Record<
    string,
    unknown
  >[];
  if (raw.length === 0) return { longRows: [], hasYear: false };

  const hasYear =
    Object.prototype.hasOwnProperty.call(raw[0]!, 'year') &&
    raw[0]!['year'] != null &&
    String(raw[0]!['year']).trim() !== '';

  const yFallback = (): number => {
    if (meta?.dataset_year != null && String(meta.dataset_year).trim() !== '') {
      return Number(meta.dataset_year);
    }
    return new Date().getFullYear();
  };

  const longRows: LongRow[] = raw.map((r) => {
    const rawVal = r['value'] != null && r['value'] !== '' ? r['value'] : r['gdp_per_capita'];
    const value = rawVal != null && rawVal !== '' ? Number(rawVal) : NaN;
    return {
      name_en: String(r['name_en'] ?? ''),
      name_local: String(r['name_local'] ?? ''),
      svg_id: String(r['svg_id'] ?? ''),
      year: hasYear ? Number(r['year']) : yFallback(),
      population: Number(r['population'] ?? NaN),
      area_km2: Number(r['area_km2'] ?? NaN),
      value,
    };
  });
  return { longRows, hasYear };
}

export function resolveDisplayYear(meta: MetaLike, longRows: LongRow[]): number {
  const years = longRows.map((r) => r.year).filter((y) => Number.isFinite(y));
  if (years.length === 0) {
    if (meta?.dataset_year != null && String(meta.dataset_year).trim() !== '') {
      return Number(meta.dataset_year);
    }
    return new Date().getFullYear();
  }
  const distinct = [...new Set(years)];
  const maxY = Math.max(...distinct);
  if (meta?.dataset_year != null && String(meta.dataset_year).trim() !== '') {
    const want = Number(meta.dataset_year);
    if (Number.isFinite(want) && distinct.includes(want)) return want;
  }
  return maxY;
}

export function readMarketingDataCsv(
  dataPath: string,
  meta: MetaLike,
): { longRows: LongRow[]; hasYear: boolean } {
  const content = readFileSync(dataPath, 'utf-8');
  return parseMarketingDataContent(content, meta);
}

export function selectSliceForMapYear(
  displayYear: string | number,
  longRows: LongRow[],
): LongRow[] {
  const y = Number(displayYear);
  const rows = longRows.filter((r) => r.year === y);
  if (rows.length === 0) {
    throw new Error(
      `No data rows for year ${displayYear}. Add rows in data.csv or fix meta.dataset_year.`,
    );
  }
  return rows;
}

export function longRowsToDivisions(
  longRows: LongRow[],
  displayYear: number,
  regionId: string,
): Array<{
  region_id: string;
  name_en: string;
  name_local: string;
  svg_id: string;
  population: number;
  area_km2: number;
  value: number;
}> {
  return longRows
    .filter((r) => r.year === displayYear)
    .map((r) => ({
      region_id: regionId,
      name_en: r.name_en,
      name_local: r.name_local,
      svg_id: r.svg_id,
      population: r.population,
      area_km2: r.area_km2,
      value: r.value,
    }));
}

/**
 * Returns true when GDP per capita should be used as the primary choropleth value.
 * Falls back to population when >50% of rows for the display year have no value.
 */
export function shouldUseGdpPerCapita(longRows: LongRow[], displayYear: number): boolean {
  const yearRows = longRows.filter((r) => r.year === displayYear);
  if (yearRows.length === 0) return false;
  const withValue = yearRows.filter((r) => Number.isFinite(r.value) && r.value > 0);
  return withValue.length / yearRows.length > 0.5;
}
