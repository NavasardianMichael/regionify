/**
 * Russia panel fetcher — GRDP per capita (USD) per federal subject, 5 years.
 *
 * Sources:
 *   - GRP (billion RUB): Rosstat / EMISS fedstat.ru
 *   - FX (RUB/USD): World Bank PA.NUS.FCRF
 *   - Population, area: Wikidata SPARQL
 */
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { DATA_CSV_HEADER } from '../lib/marketingDataCsv.ts';
import {
  buildRussiaPanel,
  PANEL_SOURCE_META,
  extractRegionsFromMapSvg,
} from '../lib/fetchRussiaPanel.ts';

type PanelFetchContext = {
  slug: string;
  meta: Record<string, unknown> & { dataset_year?: string; map_file?: string };
  assetsRoot: string;
  marketingRoot: string;
  countryDir: string;
};

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

export default async function runRussia(ctx: PanelFetchContext): Promise<void> {
  const mapFile = ctx.meta.map_file as string | undefined;
  if (typeof mapFile !== 'string' || !mapFile.endsWith('.svg')) {
    throw new Error('meta.map_file must be the Russia SVG filename (e.g. "russia.svg")');
  }
  const mapPath = join(ctx.marketingRoot, '../client/src/assets/images/maps', mapFile);
  if (!existsSync(mapPath)) throw new Error(`Map SVG not found: ${mapPath}`);

  const preferredYear = Number(String(ctx.meta.dataset_year ?? '').trim()) || 2025;
  const years = Array.from({ length: 5 }, (_, i) => preferredYear - 4 + i);

  console.log(
    `  (russia: fetching GRDP per federal subject for years ${years[0]}–${years[years.length - 1]})`,
  );
  console.log(`  Primary source: Rosstat / fedstat.ru`);

  const { rows, report } = await buildRussiaPanel({ mapPath, years });

  if (report.missing_wd.length > 0) {
    console.warn(
      `  Warning: Wikidata missing population for ${report.missing_wd.length} region(s): ${report.missing_wd.join(', ')}`,
    );
  }
  if (report.missing_grp.length > 0) {
    console.warn(
      `  Warning: no GRP data for ${report.missing_grp.length} (region, year) pair(s) — those rows will have empty value`,
    );
  }

  let out = DATA_CSV_HEADER + '\n';
  for (const r of rows) {
    out += csvLine([
      r.name_en,
      r.name_local,
      r.svg_id,
      r.year,
      r.population,
      r.area_km2,
      Number.isFinite(r.gdp_per_capita) ? r.gdp_per_capita : '',
    ]);
  }

  const dataPath = join(ctx.countryDir, 'data.csv');
  writeFileSync(dataPath, out);

  const regions = extractRegionsFromMapSvg(mapPath);
  console.log(`  ✓ data.csv written (${regions.length} regions × ${years.length} years)`);

  const sourcesPath = join(ctx.countryDir, 'sources.json');
  writeFileSync(
    sourcesPath,
    JSON.stringify(
      {
        panel_fetch: {
          last_fetched: new Date().toISOString(),
          years,
          rub_per_usd: report.rub_per_usd,
          missing_grp_count: report.missing_grp.length,
        },
        sources: PANEL_SOURCE_META,
      },
      null,
      2,
    ),
  );
}
