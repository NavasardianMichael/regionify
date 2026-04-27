import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'csv-parse/sync';

// process.cwd() is the marketing/ project root in both dev and build contexts
const dataDir = join(process.cwd(), 'data');

export type CountryRow = {
  slug: string;
  region_id: string;
  name_en: string;
  name_local: string;
  capital: string;
  division_type: string;
  division_count: number;
};

export function getCountries(): CountryRow[] {
  const content = readFileSync(join(dataDir, 'countries.csv'), 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
  }) as CountryRow[];
}
