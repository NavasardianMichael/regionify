/**
 * One command for the full marketing country pipeline:
 *   1. Fetch panel data  (registered panel_fetcher)
 *   2. Provision project (create/update project + enable embed via API)
 *   3. Generate showcase assets  (SVG, GIF, WebM, embed-page screenshot)
 *   4. Copy showcases/ → public/assets/{slug}/
 *
 * Usage:
 *   pnpm run marketing:assets -- armenia
 *   pnpm run marketing:assets -- all
 *   pnpm run marketing:assets -- all --skip russia,georgia
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const marketingRoot = join(__dirname, '..');
const assetsRoot = join(marketingRoot, 'assets');

config({ path: join(marketingRoot, '.env') });

function listCountrySlugs(): string[] {
  if (!existsSync(assetsRoot)) return [];
  return readdirSync(assetsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name)
    .filter((name) => {
      try {
        return statSync(join(assetsRoot, name, 'meta.json')).isFile();
      } catch {
        return false;
      }
    });
}

function parseArgs(argv: string[]): {
  slugs: string[] | 'all';
  skip: string[];
} {
  const skipIdx = argv.indexOf('--skip');
  const skip: string[] =
    skipIdx >= 0 && argv[skipIdx + 1]
      ? argv[skipIdx + 1]!.split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const positional = argv.filter((a) => !a.startsWith('--') && a !== argv[skipIdx + 1]);

  if (positional[0] === 'all') return { slugs: 'all', skip };
  if (positional[0]) return { slugs: [positional[0]], skip };

  // Default to all if only one country exists
  const found = listCountrySlugs();
  if (found.length === 1) {
    console.log(`(default: ${found[0]})`);
    return { slugs: found, skip };
  }
  console.error(
    'Usage:\n  pnpm run marketing:assets -- <slug>\n  pnpm run marketing:assets -- all [--skip slug1,slug2]',
  );
  console.error(`Countries: ${found.join(', ')}`);
  process.exit(1);
}

const TSCONFIG = join(__dirname, 'tsconfig.json');

function runTsx(scriptRelative: string, args: string[] = []): void {
  const script = join(__dirname, scriptRelative);
  const r = spawnSync('npx', ['tsx', '--tsconfig', TSCONFIG, script, ...args], {
    stdio: 'inherit',
    cwd: marketingRoot,
    env: process.env,
    shell: true,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function processSlug(slug: string): Promise<void> {
  const metaPath = join(assetsRoot, slug, 'meta.json');
  if (!existsSync(metaPath)) {
    console.error(`  Missing ${metaPath} — skip`);
    return;
  }

  const meta = JSON.parse(readFileSync(metaPath, 'utf-8')) as {
    dataset_year?: string;
    panel_fetcher?: string;
  };

  if (!meta.dataset_year) {
    console.warn(`  Warning: meta.json for ${slug} has no dataset_year — defaulting to 2025`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Country: ${slug}`);
  console.log(`${'='.repeat(60)}`);

  // Step 1: Fetch panel data
  console.log('\n→ Step 1/4: Fetch panel data');
  const dataCsv = join(assetsRoot, slug, 'data.csv');
  if (!meta.panel_fetcher || meta.panel_fetcher === 'none') {
    if (!existsSync(dataCsv)) {
      throw new Error(
        `No panel_fetcher and no data.csv for ${slug}. ` +
          `Add data manually to marketing/assets/${slug}/data.csv`,
      );
    }
    console.log('  (no panel_fetcher — using existing data.csv)');
  } else {
    runTsx('fetch-panel.ts', [slug]);
  }

  // Step 2: Provision project (requires REGIONIFY_EMAIL + REGIONIFY_PASSWORD)
  console.log('\n→ Step 2/4: Provision Regionify project');
  const email = process.env['REGIONIFY_EMAIL'];
  const password = process.env['REGIONIFY_PASSWORD'];
  if (!email || !password) {
    throw new Error(
      'REGIONIFY_EMAIL and REGIONIFY_PASSWORD must be set in marketing/.env\n' +
        'Example:\n  REGIONIFY_EMAIL=you@example.com\n  REGIONIFY_PASSWORD=yourpassword',
    );
  }
  runTsx('provision-project.ts', [slug]);

  // Step 3: Generate showcase assets
  console.log('\n→ Step 3/4: Generate showcase assets');
  runTsx('generate-showcase-assets.ts', [slug]);

  // Step 4: Copy to public/
  console.log('\n→ Step 4/4: Copy assets to public/');
  runTsx('copy-assets.ts');
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const { slugs, skip } = parseArgs(argv);

  const resolved = slugs === 'all' ? listCountrySlugs() : slugs;
  if (resolved.length === 0) {
    console.error('No countries found under marketing/assets/*/meta.json');
    process.exit(1);
  }

  const toProcess = resolved.filter((s) => !skip.includes(s));
  if (skip.length > 0) {
    console.log(`Skipping: ${skip.join(', ')}`);
  }

  for (const slug of toProcess) {
    await processSlug(slug);
  }

  console.log('\n✓ marketing:assets done');
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
