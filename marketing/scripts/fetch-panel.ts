/**
 * Run the registered `panel_fetcher` to refresh long-format `data.csv` for a country.
 * Called by marketing-assets.ts; can also be run standalone:
 *   tsx scripts/fetch-panel.ts armenia
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runPanelFetch } from './fetchers/index.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const marketingRoot = join(__dirname, '..');
const assetsRoot = join(marketingRoot, 'assets');

async function main(): Promise<void> {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: tsx scripts/fetch-panel.ts <slug>');
    process.exit(1);
  }

  const metaPath = join(assetsRoot, slug, 'meta.json');
  if (!existsSync(metaPath)) {
    console.error(`Missing ${metaPath}`);
    process.exit(1);
  }

  const meta = JSON.parse(readFileSync(metaPath, 'utf-8')) as Record<string, unknown>;
  console.log(`\n== panel fetch: ${slug} ==`);
  await runPanelFetch({ slug, meta, assetsRoot, marketingRoot });
  console.log('✓ fetch-panel done');
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
