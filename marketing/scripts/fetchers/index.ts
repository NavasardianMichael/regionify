/**
 * Dispatches panel data fetch to the registered country-specific fetcher.
 * Each fetcher lives at `fetchers/{panel_fetcher}.ts` and exports a default async function.
 *
 * If no fetcher is registered for a slug, or `panel_fetcher` is absent/empty,
 * the script logs a notice and skips (no error — data.csv is left as-is).
 */
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type PanelFetchContext = {
  slug: string;
  meta: Record<string, unknown> & { panel_fetcher?: string; dataset_year?: string };
  assetsRoot: string;
  marketingRoot: string;
  countryDir: string;
};

function resolveFetcherId(meta: PanelFetchContext['meta']): string | null {
  const raw = meta?.panel_fetcher;
  if (raw == null || raw === '' || String(raw) === 'none') return null;
  return String(raw);
}

export async function runPanelFetch(ctx: Omit<PanelFetchContext, 'countryDir'>): Promise<void> {
  const id = resolveFetcherId(ctx.meta);
  if (id === null) {
    console.log(`  (no panel_fetcher for ${ctx.slug} — data.csv unchanged)`);
    return;
  }

  const fetcherPath = join(__dirname, `${id}.ts`);
  let mod: { default?: (ctx: PanelFetchContext) => Promise<void> };
  try {
    mod = (await import(pathToFileURL(fetcherPath).href)) as typeof mod;
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('Cannot find module')) {
      throw new Error(
        `Unknown panel_fetcher "${id}" — create marketing/scripts/fetchers/${id}.ts with a default export.`,
      );
    }
    throw e;
  }

  if (typeof mod.default !== 'function') {
    throw new Error(`fetchers/${id}.ts must export a default async function`);
  }

  await mod.default({ ...ctx, countryDir: join(ctx.assetsRoot, ctx.slug) });
}
