/**
 * One-time script: scan all SVG maps, derive country rows, write marketing/data/countries.csv.
 * Run: pnpm --filter @regionify/marketing tsx scripts/generate-countries-csv.ts
 * Commit the resulting data/countries.csv.
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = join(__dirname, '..', '..', 'client', 'src', 'assets', 'images', 'maps');
const DATA_DIR = join(__dirname, '..', 'data');
const OUT_FILE = join(DATA_DIR, 'countries.csv');

// Slugs that are not individual countries (continent/region/world maps)
const SKIP_SLUGS = new Set([
  'africa',
  'asia',
  'europe',
  'world',
  'worldAntarctica',
  'worldIndia',
  'worldPacificRim',
  'worldRussiaSplit',
  'latinAmerica',
  'northAmerica',
  'northAmericaNoGreenland',
  'southAmerica',
  'caribbean',
  'centralAmerica',
  'middleEast',
  'unRegions',
  'continentsRegions',
  'continentsRussiaAntarctica',
  'australiaOceania',
]);

// Slugs that are variants of another country (alternate boundary sets, subdivisions, etc.)
const VARIANT_PATTERNS: RegExp[] = [
  /\d+$/, // ends with digits: france2016, india2019, morocco2015
  /Cantons$/, // bosniaHerzegovinaCantons
  /Departments$/, // franceDepartments
  /Mercator$/, // usaMercator
  /Territories(AssociatedStates)?$/, // usaTerritories, usaTerritoriesAssociatedStates
  /WithSouthOssetia$/, // georgiaWithSouthOssetia
  /NoKosovo$/, // serbiaNoKosovo
  /Regions$/, // bosniaHerzegovinaRegions (not to be confused with 'Regions' division type)
  /Provinces$/, // spainProvinces
  /West$/, // fijiWest
  /Palestine$/, // israelPalestine
  /NorthernCyprus$/, // cyprusNorthernCyprus
  /WesternSahara$/, // moroccoWesternSahara
  /RussiaSplit$|Antarctica$|India$|PacificRim$/,
];

function isVariant(slug: string): boolean {
  return VARIANT_PATTERNS.some((p) => p.test(slug));
}

/** camelCase → Title Case with spaces.  e.g. americanSamoa → American Samoa */
function camelToTitle(s: string): string {
  return s
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function countDivisions(svg: string): number {
  return [...svg.matchAll(/<path[^>]+\btitle="/g)].length;
}

type CountryMeta = {
  name_en: string;
  name_local: string;
  capital: string;
  division_type: string;
};

const countryData: Record<string, CountryMeta> = JSON.parse(
  readFileSync(join(__dirname, 'country-data.json'), 'utf-8'),
);

const files = readdirSync(MAPS_DIR).filter((f) => f.endsWith('.svg'));

const rows: string[] = ['slug,region_id,name_en,name_local,capital,division_type,division_count'];

for (const file of files) {
  const slug = file.replace(/\.svg$/, '');
  if (SKIP_SLUGS.has(slug) || isVariant(slug)) continue;

  const svg = readFileSync(join(MAPS_DIR, file), 'utf-8');
  const divisionCount = countDivisions(svg);
  if (divisionCount === 0) continue; // skip maps with no titled divisions

  const name_en = countryData[slug]?.name_en ?? camelToTitle(slug);
  const { name_local = '', capital = '', division_type = '' } = countryData[slug] ?? {};

  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  rows.push(
    [slug, slug, name_en, name_local, capital, division_type, divisionCount].map(escape).join(','),
  );
}

mkdirSync(DATA_DIR, { recursive: true });
writeFileSync(OUT_FILE, rows.join('\n') + '\n', 'utf-8');
console.log(`✓ Written ${rows.length - 1} countries to ${OUT_FILE}`);
