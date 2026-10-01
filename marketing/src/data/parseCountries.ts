import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = join(process.cwd(), 'data');

export type CountryRow = {
  slug: string;
  region_id: string;
  name_en: string;
  name_local: string;
  capital: string;
  division_type: string;
  division_count: number;
  /**
   * Geographic grouping used to cross-link neighbouring country pages. Assigned on a purely
   * geographic basis (UN M49 style) and carries no political claim. Optional so the build
   * survives a country added to `countries.json` before it is grouped.
   */
  continent?: string;
  subregion?: string;
  /** Approximate population (head count). */
  population_approx?: number;
  /** Land area in km². */
  area_km2?: number;
};

type CountriesMap = Record<string, Omit<CountryRow, 'slug' | 'region_id'>>;

export function getCountries(): CountryRow[] {
  const map: CountriesMap = JSON.parse(readFileSync(join(dataDir, 'countries.json'), 'utf-8'));
  return Object.entries(map).map(([slug, meta]) => ({ slug, region_id: slug, ...meta }));
}

export function getCountry(slug: string): CountryRow | null {
  const map: CountriesMap = JSON.parse(readFileSync(join(dataDir, 'countries.json'), 'utf-8'));
  const meta = map[slug];
  return meta ? { slug, region_id: slug, ...meta } : null;
}
