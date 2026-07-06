/**
 * Marketing screenshot generator for the LinkedIn post and Medium article.
 *
 * Produces UI-visible screenshots that the country-batch generator
 * (playwright-asset-generator.ts) does not — it hides the sidebars for cleaner
 * map exports, whereas the marketing pieces need to show the app's real interface.
 *
 * Outputs land in `docs/marketing/assets/images/` (co-located with the LinkedIn post
 * and Medium article files that reference them):
 *   - product-overview.png    — full app with data + styles sidebars visible
 *   - map-picker.png          — country dropdown open on the new-project page
 *   - data-import-panel.png   — data panel with a deliberately messy CSV pasted
 *   - styling-panel.png       — right panel focused, palette + legend controls visible
 *
 * The auth-state cache stays in `marketing/assets/` alongside the country-batch
 * generator's cache so both scripts share the same persisted session.
 *
 * The AI-parser review dialog is intentionally not captured here — mocking the
 * SSE stream is non-trivial and the article/post read fine without it.
 *
 * Run:
 *   pnpm --filter @regionify/marketing generate-marketing-screenshots
 *
 * Requires:
 *   marketing/.env with CLIENT_URL, REGIONIFY_EMAIL, REGIONIFY_PASSWORD set.
 *   Account must be on any paid tier (Explorer or Chronographer).
 */

import { chromium, type BrowserContext, type Page } from 'playwright';
import { config as loadEnv } from 'dotenv';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dirname, '..', '.env') });

const BASE_URL = (process.env.CLIENT_URL ?? '').replace(/\/$/, '');
const EMAIL = process.env.REGIONIFY_EMAIL ?? '';
const PASSWORD = process.env.REGIONIFY_PASSWORD ?? '';

/** Auth-state cache shared with the country-batch generator. */
const ASSETS_ROOT = join(__dirname, '..', 'assets');
const AUTH_STATE_FILE = join(ASSETS_ROOT, '.auth-state.json');
/** Screenshot outputs live next to the post/article files that reference them. */
const OUTPUT_DIR = join(__dirname, '..', '..', 'docs', 'marketing', 'assets', 'images');

/**
 * Country to use for every screenshot. Spain works well because:
 *   - autonomous communities are visually distinct
 *   - names have realistic messiness (Cataluña / Catalonia / Cataluña)
 *   - existing per-country assets already exist for reference
 */
const DEMO_COUNTRY = { slug: 'spain', name: 'Spain' } as const;

/**
 * A deliberately messy Spain regions CSV that showcases the AI parser's job.
 * Mixes casing, diacritics, common abbreviations, and language variants.
 */
const MESSY_SPAIN_CSV = [
  'Region,Population',
  'Cataluña,7500000',
  'madrid,6700000',
  'Andalucia,8500000',
  'PAIS VASCO,2200000',
  'Galicia,2700000',
  'comunidad valenciana,5000000',
  'Castilla-la Mancha,2000000',
  'canarias,2200000',
].join('\n');

const VIEWPORT = { width: 1600, height: 1000 } as const;

// ---------------------------------------------------------------------------
// Helpers — adapted from playwright-asset-generator.ts, self-contained
// ---------------------------------------------------------------------------

function log(msg: string): void {
  console.log(`[marketing] ${msg}`);
}

async function ensureOutputDir(): Promise<void> {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function login(page: Page, context: BrowserContext): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.locator('input#email').fill(EMAIL);
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();

  // Evict older sessions if the device-limit prompt appears
  const evictBtn = page.getByRole('button', { name: 'Sign in and log out from all other devices' });
  const evictAppeared = await evictBtn
    .waitFor({ timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
  if (evictAppeared) {
    log('Session limit hit — evicting other devices');
    await evictBtn.click();
  }

  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 40_000 });
  await page.waitForLoadState('networkidle', { timeout: 25_000 });
  await page.waitForTimeout(1_000);

  mkdirSync(ASSETS_ROOT, { recursive: true });
  await context.storageState({ path: AUTH_STATE_FILE });
  log(`Logged in — session saved`);
}

/**
 * Reuses the saved auth state when possible; falls back to a fresh login.
 */
async function ensureAuthedContext(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
): Promise<BrowserContext> {
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: VIEWPORT,
    ...(existsSync(AUTH_STATE_FILE) ? { storageState: AUTH_STATE_FILE } : {}),
  });
  const page = await context.newPage();

  if (existsSync(AUTH_STATE_FILE)) {
    await page.goto(`${BASE_URL}/projects`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    const sessionExpired = await page
      .waitForURL((url) => url.pathname.startsWith('/login'), { timeout: 3_000 })
      .then(() => true)
      .catch(() => false);
    if (sessionExpired) {
      log('Saved session expired — logging in fresh');
      await login(page, context);
    } else {
      log('Resumed saved session');
    }
  } else {
    await login(page, context);
  }

  await page.close();
  return context;
}

/**
 * Waits until the visualizer confirms an authed session by checking for the
 * Embed button — the same signal the country-batch script relies on.
 */
async function waitForVisualizerLoggedIn(page: Page, timeoutMs = 30_000): Promise<void> {
  await page
    .locator('[data-i18n-key="visualizer.embed.openButton"]')
    .waitFor({ state: 'visible', timeout: timeoutMs });
}

/**
 * Open the demo project — reuses one if it exists, creates a new one otherwise.
 * Adapted from playwright-asset-generator.ts::openOrCreateProject().
 */
async function openDemoProject(page: Page, context: BrowserContext): Promise<void> {
  await page.goto(`${BASE_URL}/projects`);
  if (page.url().includes('/login')) {
    log('Session expired mid-run — re-logging in');
    await login(page, context);
    await page.goto(`${BASE_URL}/projects`);
  }
  await page.waitForLoadState('networkidle', { timeout: 15_000 });

  const searchInput = page
    .locator(
      'input[data-i18n-key="projects.searchPlaceholder"], [data-i18n-key="projects.searchPlaceholder"] input',
    )
    .first();
  const searchVisible = await searchInput
    .waitFor({ timeout: 10_000 })
    .then(() => true)
    .catch(() => false);

  let found = false;
  if (searchVisible) {
    await searchInput.fill(DEMO_COUNTRY.name);
    await page.waitForTimeout(600);
    const matchingCard = page.locator('.ant-card').filter({ hasText: DEMO_COUNTRY.name }).first();
    found = await matchingCard.isVisible({ timeout: 2_000 }).catch(() => false);
    if (found) {
      log('Found existing Spain project — opening');
      await matchingCard.click({ timeout: 10_000 });
    }
  }

  if (!found) {
    log('No existing Spain project — creating new one');
    await page.goto(`${BASE_URL}/projects/new`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await waitForVisualizerLoggedIn(page);

    const regionInput = page.locator('input[aria-label="Select a country"]');
    await regionInput.waitFor({ timeout: 15_000 });
    await regionInput.click();
    await page.keyboard.type(DEMO_COUNTRY.name, { delay: 50 });
    await page.locator('.ant-select-dropdown:visible').waitFor({ timeout: 5_000 });
    await page
      .locator('.ant-select-dropdown:visible .ant-select-item-option-content', {
        hasText: DEMO_COUNTRY.name,
      })
      .first()
      .click({ timeout: 30_000 });

    await page.waitForLoadState('networkidle', { timeout: 20_000 });
    await page.getByRole('button', { name: 'Switch to static data' }).waitFor({ timeout: 30_000 });

    // Persist with default project name
    await page.getByRole('button', { name: 'Save' }).click();
    await page
      .locator('.ant-modal')
      .filter({ hasText: 'Save Project' })
      .waitFor({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Create' }).click();
  }

  await page.waitForURL(`${BASE_URL}/projects/**`, { timeout: 15_000 });
  await page
    .locator('[data-i18n-key="visualizer.embed.openButton"]:not([disabled])')
    .waitFor({ timeout: 30_000 });
  log('Demo project ready');
}

/**
 * Ensure the right styles panel is NOT collapsed — the country-batch script
 * collapses it, so we may inherit that state on an existing project.
 *
 * Detection: the last `.ant-splitter-bar` separator reports position via
 * `aria-valuenow`. When the right panel is collapsed the separator sits past
 * its `aria-valuemax` (typically valuenow=100, valuemax=85). When expanded it
 * stays inside [valuemin, valuemax].
 */
async function expandRightPanel(page: Page): Promise<void> {
  const separator = page.locator('.ant-splitter-bar').last();
  const exists = await separator.isVisible({ timeout: 2_000 }).catch(() => false);
  if (!exists) return;

  const valueNow = Number(await separator.getAttribute('aria-valuenow'));
  const valueMax = Number(await separator.getAttribute('aria-valuemax'));
  if (Number.isNaN(valueNow) || Number.isNaN(valueMax)) return;

  if (valueNow <= valueMax) {
    // Already inside the allowed range → panel is expanded
    return;
  }

  // Panel is collapsed to the right. The expand affordance is the "start"-side
  // toggle (arrow pointing back toward the map area).
  const expandBtn = page.locator('.ant-splitter-bar-collapse-bar-start').last();
  const btnVisible = await expandBtn.isVisible({ timeout: 2_000 }).catch(() => false);
  if (btnVisible) {
    await expandBtn.click({ force: true });
  } else {
    // Fallback: drag the separator back to the mid-range value
    const box = await separator.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x - 300, box.y + box.height / 2, { steps: 10 });
      await page.mouse.up();
    }
  }
  // Wait until the separator reports a position inside [valuemin, valuemax]
  await page
    .waitForFunction(
      (max) => {
        const bars = document.querySelectorAll('.ant-splitter-bar');
        const last = bars[bars.length - 1];
        if (!last) return false;
        const v = Number(last.getAttribute('aria-valuenow'));
        return !Number.isNaN(v) && v <= max;
      },
      valueMax,
      { timeout: 5_000 },
    )
    .catch(() => {});
  await page.waitForTimeout(400);
}

// ---------------------------------------------------------------------------
// Capture routines
// ---------------------------------------------------------------------------

/**
 * Screenshot 1 — /projects/new with the country dropdown open.
 *
 * Shows off the map picker as an entry point. The dropdown is visually rich
 * (icons + names) and immediately communicates the "200+ countries" claim.
 */
async function captureMapPicker(context: BrowserContext): Promise<void> {
  const page = await context.newPage();
  try {
    await page.setViewportSize(VIEWPORT);
    await page.goto(`${BASE_URL}/projects/new`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await waitForVisualizerLoggedIn(page);

    const regionInput = page.locator('input[aria-label="Select a country"]');
    await regionInput.click();
    // Wait for the virtualized dropdown to render its first batch of options
    await page.locator('.ant-select-dropdown:visible .ant-select-item-option').first().waitFor({
      timeout: 5_000,
    });
    // A short beat so options finish their fade-in animation
    await page.waitForTimeout(400);

    const outPath = join(OUTPUT_DIR, 'map-picker.png');
    await page.screenshot({ path: outPath, fullPage: false });
    log(`✓ ${outPath}`);
  } finally {
    await page.close();
  }
}

/**
 * Screenshot 2 — full app with data + styles sidebars visible.
 *
 * The hero product shot. Countries the batch script generated have their right
 * panel collapsed for cleaner map exports; here we want it visible.
 */
async function captureProductOverview(context: BrowserContext): Promise<void> {
  const page = await context.newPage();
  try {
    await page.setViewportSize(VIEWPORT);
    await openDemoProject(page, context);
    await expandRightPanel(page);
    // Map SVG renders with its natural aspect ratio and can sit below the
    // viewport fold when the container is taller than the map. A full-page
    // capture reliably includes both panels + the whole map.
    await page.waitForTimeout(3_000);

    const outPath = join(OUTPUT_DIR, 'product-overview.png');
    await page.screenshot({ path: outPath, fullPage: true });
    log(`✓ ${outPath}`);
  } finally {
    await page.close();
  }
}

/**
 * Screenshot 3 — data import panel with a deliberately messy CSV pasted.
 *
 * Uses the manual-text-entry mode of the ImportDataPanel. The messy input is
 * visible before any parsing runs, so this screenshot shows the "before" state
 * that motivates the AI parser feature.
 */
async function captureDataImportPanel(context: BrowserContext): Promise<void> {
  const page = await context.newPage();
  try {
    await page.setViewportSize(VIEWPORT);
    await openDemoProject(page, context);

    // The action button rendered below the mode selector only exists for the
    // currently-selected import type. Default is CSV upload (no manual button).
    // Switch to the tab_delimited mode. IMPORT_DATA_TYPES.tabDelimited === 'tab_delimited';
    // Ant Design Radio renders a hidden <input type="radio" value="tab_delimited"> inside
    // an .ant-radio-wrapper — check() targets the input directly and works regardless of the
    // visual click target (label text is locale-dependent).
    const tabDelimitedRadio = page.locator('input[type="radio"][value="tab_delimited"]');
    await tabDelimitedRadio.waitFor({ timeout: 15_000 });
    await tabDelimitedRadio.check({ force: true });

    // Now the "Edit manually in text" button should mount
    const editTextBtn = page.locator('[data-i18n-key="visualizer.importData.editManuallyInText"]');
    await editTextBtn.waitFor({ timeout: 10_000 });
    await editTextBtn.click();

    // The tab-delimited manual entry modal opens with a textarea
    const modal = page.locator('.ant-modal:visible').last();
    await modal.waitFor({ timeout: 10_000 });
    const textarea = modal.locator('textarea').first();
    await textarea.waitFor({ timeout: 5_000 });
    await textarea.fill(MESSY_SPAIN_CSV);
    // Blur the textarea so its focus outline doesn't dominate the screenshot
    await page.keyboard.press('Tab').catch(() => {});
    await page.waitForTimeout(500);

    const outPath = join(OUTPUT_DIR, 'data-import-panel.png');
    await page.screenshot({ path: outPath, fullPage: false });
    log(`✓ ${outPath}`);

    // Close the modal so any subsequent captures start from a clean state
    await page.keyboard.press('Escape').catch(() => {});
  } finally {
    await page.close();
  }
}

/**
 * Screenshot 4 — styling panel focused, showing palette + legend controls.
 *
 * Same layout as product-overview, but zoomed toward the right panel by
 * expanding the styles collapse and taking a viewport-anchored crop.
 */
async function captureStylingPanel(context: BrowserContext): Promise<void> {
  const page = await context.newPage();
  try {
    await page.setViewportSize(VIEWPORT);
    await openDemoProject(page, context);
    await expandRightPanel(page);

    // Expand the Background and Ranges collapses so palette + legend controls are visible
    for (const key of [
      'visualizer.mapStyles.collapseBackground',
      'visualizer.legendConfig.collapseRanges',
    ]) {
      const collapse = page.locator(`[data-i18n-key="${key}"]`).first();
      if (await collapse.isVisible({ timeout: 1_500 }).catch(() => false)) {
        await collapse.click();
        await page.waitForTimeout(200);
      }
    }

    await page.waitForTimeout(500);
    const outPath = join(OUTPUT_DIR, 'styling-panel.png');
    await page.screenshot({ path: outPath, fullPage: false });
    log(`✓ ${outPath}`);
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  if (!BASE_URL || !EMAIL || !PASSWORD) {
    console.error(
      'Missing config. Set CLIENT_URL, REGIONIFY_EMAIL, REGIONIFY_PASSWORD in marketing/.env',
    );
    process.exit(1);
  }

  await ensureOutputDir();

  const cliArgs = process.argv.slice(2);
  const headed = cliArgs.includes('--headed');
  // Which routines to run. Default: all. Pass --only=map-picker,styling-panel to filter.
  const onlyArg = cliArgs.find((a) => a.startsWith('--only='));
  const only = onlyArg ? onlyArg.slice('--only='.length).split(',') : null;

  const browser = await chromium.launch({ headless: !headed, slowMo: 80 });
  const context = await ensureAuthedContext(browser);

  const routines: Array<{ id: string; fn: (ctx: BrowserContext) => Promise<void> }> = [
    { id: 'map-picker', fn: captureMapPicker },
    { id: 'product-overview', fn: captureProductOverview },
    { id: 'data-import-panel', fn: captureDataImportPanel },
    { id: 'styling-panel', fn: captureStylingPanel },
  ];

  const toRun = only ? routines.filter((r) => only.includes(r.id)) : routines;
  if (only && toRun.length === 0) {
    console.error(`No routines matched --only=${only.join(',')}`);
    console.error(`Available: ${routines.map((r) => r.id).join(', ')}`);
    process.exit(1);
  }

  const failed: string[] = [];
  for (const routine of toRun) {
    log(`▶ ${routine.id}`);
    try {
      await routine.fn(context);
    } catch (err) {
      console.error(`✗ ${routine.id} failed:`, err);
      failed.push(routine.id);
    }
  }

  await context.close();
  await browser.close();

  if (failed.length > 0) {
    console.warn(`\n⚠  ${failed.length} routine(s) failed: ${failed.join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log(`\n✅  All marketing screenshots saved to ${OUTPUT_DIR}`);
  }
}

main().catch((err: unknown) => {
  console.error('\n✗  Unhandled script error:', err);
  process.exit(1);
});
