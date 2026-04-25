import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import {
  divisionsForDisplayYear,
  parseMarketingDataContent,
  resolveDisplayYear,
} from '@/data/marketingCsv';

// process.cwd() is the marketing/ project root in both dev and build contexts
const assetsDir = join(process.cwd(), 'assets');

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
  intro_text: string;
  asset_svg: string;
  asset_gif: string;
  asset_mp4: string;
  asset_embed_page: string;
  /** Public embed URL — when set, the iframe showcase renders a live <iframe> */
  embed_public_url?: string;
  /** Default seconds per time period for animation exports (optional). */
  seconds_per_period?: number;
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

type MetaJson = Partial<CountryRow> & {
  slug: string;
  region_id: string;
  /** When set, prefer this survey year in `data.csv` for the static map; if absent for that year, use latest `year` in the file. */
  dataset_year?: string;
};

function listCountrySlugs(): string[] {
  let entries: string[];
  try {
    entries = readdirSync(assetsDir);
  } catch {
    return [];
  }
  return entries.filter((name) => {
    if (name.startsWith('.') || name.startsWith('_')) return false;
    const full = join(assetsDir, name);
    try {
      if (!statSync(full).isDirectory()) return false;
    } catch {
      return false;
    }
    const metaPath = join(full, 'meta.json');
    const dataPath = join(full, 'data.csv');
    try {
      return statSync(metaPath).isFile() && statSync(dataPath).isFile();
    } catch {
      return false;
    }
  });
}

function loadCountryFromSlug(slug: string): CountryRow {
  const dir = join(assetsDir, slug);
  const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf-8')) as MetaJson;
  const dataContent = readFileSync(join(dir, 'data.csv'), 'utf-8');
  const { longRows } = parseMarketingDataContent(dataContent, meta);
  const displayYear = resolveDisplayYear(meta, longRows);
  const divisions = divisionsForDisplayYear(longRows, displayYear, meta.region_id ?? slug);
  const division_count = divisions.length;

  return {
    slug: meta.slug ?? slug,
    region_id: meta.region_id ?? slug,
    map_file: meta.map_file ?? '',
    name_en: meta.name_en ?? '',
    name_local: meta.name_local ?? '',
    flag_emoji: meta.flag_emoji ?? '',
    capital: meta.capital ?? '',
    population: Number(meta.population ?? 0),
    area_km2: Number(meta.area_km2 ?? 0),
    continent: meta.continent ?? '',
    subregion: meta.subregion ?? '',
    official_languages: meta.official_languages ?? '',
    division_type: meta.division_type ?? '',
    division_count,
    dataset_label: meta.dataset_label ?? '',
    dataset_unit: meta.dataset_unit ?? '',
    dataset_year: String(displayYear),
    dataset_source: meta.dataset_source ?? '',
    dataset_source_url: meta.dataset_source_url ?? '',
    seo_title: meta.seo_title ?? '',
    seo_description: meta.seo_description ?? '',
    seo_keywords: meta.seo_keywords ?? '',
    intro_text: meta.intro_text ?? '',
    asset_svg: meta.asset_svg ?? '',
    asset_gif: meta.asset_gif ?? '',
    asset_mp4: meta.asset_mp4 ?? '',
    asset_embed_page: meta.asset_embed_page ?? '',
    embed_public_url: meta.embed_public_url,
    seconds_per_period: meta.seconds_per_period,
  };
}

export function getCountries(): CountryRow[] {
  const slugs = listCountrySlugs();
  const countries = slugs.map(loadCountryFromSlug);
  countries.sort((a, b) => a.name_en.localeCompare(b.name_en, 'en'));
  return countries;
}

export function getDivisionsForSlug(slug: string): DivisionRow[] {
  const dir = join(assetsDir, slug);
  const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf-8')) as MetaJson;
  const dataContent = readFileSync(join(dir, 'data.csv'), 'utf-8');
  const { longRows } = parseMarketingDataContent(dataContent, meta);
  const displayYear = resolveDisplayYear(meta, longRows);
  return divisionsForDisplayYear(longRows, displayYear, meta.region_id ?? slug);
}

export function getDivisionsForCountry(regionId: string): DivisionRow[] {
  const slug = getCountries().find((c) => c.region_id === regionId)?.slug;
  if (!slug) return [];
  return getDivisionsForSlug(slug);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

export function formatArea(km2: number): string {
  return `${new Intl.NumberFormat('en-US').format(km2)} km²`;
}
