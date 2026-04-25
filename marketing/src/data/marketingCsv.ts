import { parse } from 'csv-parse/sync';

export type LongRow = {
  name_en: string;
  name_local: string;
  svg_id: string;
  year: number;
  population: number;
  area_km2: number;
  value: number;
};

/** Same rules as `scripts/lib/marketingDataCsv.mjs` (keep in sync). */
export function parseMarketingDataContent(
  content: string,
  meta: { dataset_year?: string } | null,
): { longRows: LongRow[]; hasYear: boolean } {
  const raw = parse(content, { columns: true, skip_empty_lines: true, cast: true }) as Record<
    string,
    string | number | undefined
  >[];
  if (raw.length === 0) {
    return { longRows: [], hasYear: false };
  }
  const hasYear =
    Object.prototype.hasOwnProperty.call(raw[0]!, 'year') &&
    raw[0]!.year != null &&
    String(raw[0]!.year).trim() !== '';
  const yFallback = (): number => {
    if (meta?.dataset_year != null && String(meta.dataset_year).trim() !== '') {
      return Number(meta.dataset_year);
    }
    return new Date().getFullYear();
  };
  const longRows: LongRow[] = raw.map((r) => {
    const value =
      r.value != null && r.value !== ''
        ? r.value
        : (r as { gdp_per_capita?: number }).gdp_per_capita;
    return {
      name_en: String(r.name_en),
      name_local: String(r.name_local),
      svg_id: String(r.svg_id),
      year: hasYear ? Number(r.year) : yFallback(),
      population: Number(r.population),
      area_km2: Number(r.area_km2),
      value: Number(value),
    };
  });
  return { longRows, hasYear };
}

export function resolveDisplayYear(
  meta: { dataset_year?: string } | null,
  longRows: LongRow[],
): number {
  const years = longRows.map((r) => r.year).filter((y) => Number.isFinite(y));
  if (years.length === 0) {
    if (meta != null && meta.dataset_year != null && String(meta.dataset_year).trim() !== '') {
      return Number(meta.dataset_year);
    }
    return new Date().getFullYear();
  }
  const distinct = [...new Set(years)];
  const maxY = Math.max(...distinct);
  if (meta != null && meta.dataset_year != null && String(meta.dataset_year).trim() !== '') {
    const want = Number(meta.dataset_year);
    if (Number.isFinite(want) && distinct.includes(want)) return want;
  }
  return maxY;
}

export function divisionsForDisplayYear(
  longRows: LongRow[],
  displayYear: number,
  regionId: string,
): {
  region_id: string;
  name_en: string;
  name_local: string;
  svg_id: string;
  population: number;
  area_km2: number;
  value: number;
}[] {
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
