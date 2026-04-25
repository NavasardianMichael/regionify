/**
 * Generates marketing showcase files under `assets/{slug}/showcases/`:
 *
 *  asset_svg        — actual colored .svg file (no screenshot)
 *  asset_gif        — temporal animation (≥2 years) or 2-variable GDP→Population fallback
 *  asset_mp4        — same animation as GIF but recorded as WebM via Playwright
 *  asset_embed_page — Playwright screenshot of the real embed page at 1920×1080
 *
 * Requires `embed_public_url` in meta.json (run the full marketing:assets pipeline first).
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  unlinkSync,
  renameSync,
  statSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';
import GIFEncoder from 'gif-encoder-2';
import { PNG } from 'pngjs';

import {
  buildColoredMapSvgString,
  loadDivisionsFromDataCsv,
  wrapMapHtml,
} from './lib/showcaseChoroplethHtml.ts';
import {
  readMarketingDataCsv,
  resolveDisplayYear,
  selectSliceForMapYear,
  shouldUseGdpPerCapita,
} from './lib/marketingDataCsv.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const marketingRoot = join(__dirname, '..');
const monorepoRoot = join(__dirname, '../..');

// Standard PC screen viewport — no custom cramped dimensions
const SCREEN_VIEWPORT = { width: 1920, height: 1080 };

type MetaJson = {
  slug: string;
  region_id?: string;
  map_file: string;
  name_en: string;
  dataset_label: string;
  dataset_unit?: string;
  dataset_year?: string;
  dataset_source?: string;
  seo_title?: string;
  asset_svg: string;
  asset_gif: string;
  asset_mp4: string;
  asset_embed_page: string;
  embed_public_url?: string;
  seconds_per_period?: number;
};

// ---------------------------------------------------------------------------
// GIF helpers
// ---------------------------------------------------------------------------

function encodeGifFromPngs(framePaths: string[], outPath: string, delayMs: number): void {
  if (framePaths.length === 0) return;
  const first = PNG.sync.read(readFileSync(framePaths[0]!));
  const { width, height } = first;
  const encoder = new GIFEncoder(width, height, 'neuquant', false);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(delayMs);
  encoder.setQuality(10);
  for (const p of framePaths) {
    const png = PNG.sync.read(readFileSync(p));
    if (png.width !== width || png.height !== height) {
      throw new Error(`GIF frame size mismatch: ${p}`);
    }
    encoder.addFrame(new Uint8ClampedArray(png.data), true);
  }
  encoder.finish();
  writeFileSync(outPath, Buffer.from(encoder.out.getData()));
}

// ---------------------------------------------------------------------------
// Timeline text helper
// ---------------------------------------------------------------------------

async function setTimelineText(page: import('playwright').Page, text: string): Promise<void> {
  await page.evaluate((t: string) => {
    const el = document.getElementById('regionify-mkt-timeline');
    if (el) el.textContent = t;
  }, text);
}

function fmtMoney(unit: string, n: number): string {
  const u = String(unit || 'USD').toUpperCase();
  if (u === 'USD') return `$${Math.round(n).toLocaleString('en-US')}`;
  return `${n.toLocaleString('en-US')} ${u}`;
}

// ---------------------------------------------------------------------------
// Animation frame strategy
// ---------------------------------------------------------------------------

type AnimationFrames =
  | {
      kind: 'temporal';
      frames: Array<{ year: number; svgString: string; label: string }>;
    }
  | {
      kind: 'two-variable';
      frameGdp: { svgString: string; label: string };
      framePopulation: { svgString: string; label: string };
    };

function buildAnimationFrames(
  dataPath: string,
  mapFilePath: string,
  meta: MetaJson,
): AnimationFrames {
  const { longRows } = readMarketingDataCsv(dataPath, meta);
  const years = [...new Set(longRows.map((r) => r.year))].sort((a, b) => a - b);

  if (years.length >= 2) {
    // Temporal animation — one frame per year
    const frames = years.map((yr) => {
      const slice = selectSliceForMapYear(yr, longRows);
      const useGdp = shouldUseGdpPerCapita(slice, yr);
      const divisions = useGdp ? slice : slice.map((r) => ({ ...r, value: r.population }));
      const svgString = buildColoredMapSvgString(mapFilePath, divisions);
      const vals = divisions.filter((d) => Number.isFinite(d.value)).map((d) => d.value);
      const median = vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)] ?? 0;
      const label = `${yr}  Median: ${fmtMoney(meta.dataset_unit ?? 'USD', median)} — ${meta.dataset_label}`;
      return { year: yr, svgString, label };
    });
    return { kind: 'temporal', frames };
  }

  // Single year — 2-variable animation: GDP per capita → Population
  const displayYear = resolveDisplayYear(meta, longRows);
  const slice = selectSliceForMapYear(displayYear, longRows);

  const gdpDivisions = slice;
  const popDivisions = slice.map((r) => ({ ...r, value: r.population }));

  return {
    kind: 'two-variable',
    frameGdp: {
      svgString: buildColoredMapSvgString(mapFilePath, gdpDivisions),
      label: `${displayYear}  ${meta.dataset_label}`,
    },
    framePopulation: {
      svgString: buildColoredMapSvgString(mapFilePath, popDivisions),
      label: `${displayYear}  Population`,
    },
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function generateShowcaseAssets(slug: string): Promise<void> {
  const outDir = join(marketingRoot, 'assets', slug, 'showcases');
  const metaPath = join(marketingRoot, 'assets', slug, 'meta.json');
  const dataPath = join(marketingRoot, 'assets', slug, 'data.csv');

  if (!existsSync(metaPath)) throw new Error(`Missing ${metaPath}`);
  if (!existsSync(dataPath)) throw new Error(`Missing ${dataPath}`);

  const meta = JSON.parse(readFileSync(metaPath, 'utf-8')) as MetaJson;

  if (!meta.embed_public_url) {
    throw new Error(
      `embed_public_url is missing in ${metaPath}.\n` +
        'Provision the project first (the full pipeline handles this automatically).',
    );
  }

  const mapFilePath = join(monorepoRoot, 'client/src/assets/images/maps', meta.map_file);
  if (!existsSync(mapFilePath)) {
    throw new Error(`Map SVG not found: ${mapFilePath}`);
  }

  mkdirSync(outDir, { recursive: true });

  const secondsPerPeriod =
    Number(meta.seconds_per_period) > 0 ? Number(meta.seconds_per_period) : 1.5;
  const periodMs = Math.round(secondsPerPeriod * 1000);
  const regionId = meta.region_id ?? slug;

  // ------------------------------------------------------------------
  // 1. SVG: write actual colored SVG file (no screenshot)
  // ------------------------------------------------------------------
  const divisions = loadDivisionsFromDataCsv(dataPath, regionId, meta);
  const coloredSvg = buildColoredMapSvgString(mapFilePath, divisions);

  const svgOutName = meta.asset_svg.replace(/\.png$/i, '.svg');
  writeFileSync(join(outDir, svgOutName), coloredSvg);
  console.log(`  ✓ SVG written: ${svgOutName}`);

  // ------------------------------------------------------------------
  // 2. GIF + MP4 (WebM): animation frames
  // ------------------------------------------------------------------
  const animFrames = buildAnimationFrames(dataPath, mapFilePath, meta);

  const frameHtmlPairs: Array<{ html: string; label: string }> =
    animFrames.kind === 'temporal'
      ? animFrames.frames.map((f) => ({
          html: wrapMapHtml(meta, f.svgString, 'viewport'),
          label: f.label,
        }))
      : [
          {
            html: wrapMapHtml(meta, animFrames.frameGdp.svgString, 'viewport'),
            label: animFrames.frameGdp.label,
          },
          {
            html: wrapMapHtml(meta, animFrames.framePopulation.svgString, 'viewport'),
            label: animFrames.framePopulation.label,
          },
        ];

  // -- GIF --
  const gifBrowser = await chromium.launch({ headless: true });
  const gifPage = await gifBrowser.newPage({ viewport: SCREEN_VIEWPORT });
  const framePaths: string[] = [];

  for (let i = 0; i < frameHtmlPairs.length; i++) {
    const { html, label } = frameHtmlPairs[i]!;
    await gifPage.setContent(html, { waitUntil: 'load' });
    await delay(300);
    await setTimelineText(gifPage, label);
    await delay(200);
    const framePath = join(outDir, `._frame-${i}.png`);
    await gifPage.screenshot({ path: framePath, type: 'png' });
    framePaths.push(framePath);
  }

  await gifBrowser.close();

  const gifOutPath = join(outDir, meta.asset_gif);
  encodeGifFromPngs(framePaths, gifOutPath, periodMs);
  for (const fp of framePaths) if (existsSync(fp)) unlinkSync(fp);
  console.log(`  ✓ GIF written: ${meta.asset_gif} (${frameHtmlPairs.length} frames)`);

  // -- WebM/MP4 via Playwright recording --
  const videoCtx = await chromium.launch({ headless: true });
  const videoContext = await videoCtx.newContext({
    recordVideo: { dir: outDir, size: SCREEN_VIEWPORT },
    viewport: SCREEN_VIEWPORT,
  });
  const videoPage = await videoContext.newPage();

  for (const { html, label } of frameHtmlPairs) {
    await videoPage.setContent(html, { waitUntil: 'load' });
    await delay(400);
    await setTimelineText(videoPage, label);
    await delay(periodMs);
  }
  await videoContext.close();
  await videoCtx.close();

  // Rename Playwright-generated .webm to meta.asset_mp4
  const webmFiles = readdirSync(outDir)
    .filter((f) => f.endsWith('.webm'))
    .map((f) => join(outDir, f))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);

  const finalVideoName = meta.asset_mp4.endsWith('.webm')
    ? meta.asset_mp4
    : meta.asset_mp4.replace(/\.mp4$/i, '.webm');

  if (webmFiles.length > 0) {
    const latest = webmFiles[0]!;
    const target = join(outDir, finalVideoName);
    if (latest !== target) {
      if (existsSync(target)) unlinkSync(target);
      renameSync(latest, target);
    }
  }
  console.log(`  ✓ video written: ${finalVideoName}`);

  // ------------------------------------------------------------------
  // 3. Embed page screenshot — Playwright opens the real embed URL
  // ------------------------------------------------------------------
  const embedBrowser = await chromium.launch({ headless: true });
  const embedPage = await embedBrowser.newPage({ viewport: SCREEN_VIEWPORT });

  await embedPage.goto(meta.embed_public_url, { waitUntil: 'networkidle', timeout: 30_000 });
  await delay(1500); // allow map to fully render

  const embedPngPath = join(outDir, meta.asset_embed_page);
  await embedPage.screenshot({ path: embedPngPath, type: 'png' });
  await embedBrowser.close();
  console.log(`  ✓ embed page screenshot: ${meta.asset_embed_page}`);
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: tsx scripts/generate-showcase-assets.ts <slug>');
    process.exit(1);
  }
  generateShowcaseAssets(slug).catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });
}
