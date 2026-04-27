import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'csv-parse/sync';

// process.cwd() is the marketing/ project root in both dev and build contexts
const dataDir = join(process.cwd(), 'data');

export type CountryRow = {
  slug: string;
  region_id: string;
  map_file: string;
  name_en: string;
  name_local: string;
  flag_emoji: string;
  capital: string;
  population: number;
  area_km2: number;
  continent: string;
  subregion: string;
  official_languages: string;
  division_type: string;
  division_count: number;
  dataset_label: string;
  dataset_unit: string;
  dataset_year: string;
  dataset_source: string;
  dataset_source_url: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  asset_static: string;
  asset_svg: string;
  asset_gif: string;
  asset_mp4: string;
  asset_embed_page: string;
  asset_embed_url: string;
};

export type DivisionRow = {
  region_id: string;
  name_en: string;
  name_local: string;
  svg_id: string;
  population: number;
  area_km2: number;
  value: number;
};

function readCsv<T>(filename: string): T[] {
  const content = readFileSync(join(dataDir, filename), 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
  }) as T[];
}

export function getCountries(): CountryRow[] {
  return readCsv<CountryRow>('countries.csv');
}

export function getDivisions(): DivisionRow[] {
  return readCsv<DivisionRow>('divisions.csv');
}

export function getDivisionsForCountry(regionId: string): DivisionRow[] {
  return getDivisions().filter((d) => d.region_id === regionId);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

export function formatArea(km2: number): string {
  return `${new Intl.NumberFormat('en-US').format(km2)} km²`;
}
