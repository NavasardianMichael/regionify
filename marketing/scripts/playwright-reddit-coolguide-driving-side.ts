/**
 * Reddit r/coolguides asset — driving side of the road (Post 02).
 *
 * Produces a 2160×1350 PNG matching the brief in:
 *   docs/marketing/reddit/week-01/02-coolguide-driving-side.md
 *
 * Run:
 *   pnpm --filter @regionify/marketing generate-reddit-coolguide-driving-side
 *   pnpm --filter @regionify/marketing generate-reddit-coolguide-driving-side -- --headed
 *
 * Requires marketing/.env with CLIENT_URL, REGIONIFY_EMAIL, REGIONIFY_PASSWORD.
 */

import { chromium, type BrowserContext, type Locator, type Page } from 'playwright';
import { config as loadEnv } from 'dotenv';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildDrivingSideCsv,
  countDrivingSides,
  DRIVING_SIDE_COLORS,
  DRIVING_SIDE_LEGEND,
  drivingSideLegendLabels,
  OUTPUT,
} from './reddit-coolguide-driving-side-data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dirname, '..', '.env') });

const BASE_URL = (process.env.CLIENT_URL ?? '').replace(/\/$/, '');
const EMAIL = process.env.REGIONIFY_EMAIL ?? '';
const PASSWORD = process.env.REGIONIFY_PASSWORD ?? '';

const ASSETS_ROOT = join(__dirname, '..', 'assets');
const AUTH_STATE_FILE = join(ASSETS_ROOT, '.auth-state.json');
const OUTPUT_DIR = join(__dirname, '..', '..', 'docs', 'marketing', 'reddit', 'week-01');
const TMP_DIR = join(ASSETS_ROOT, '.reddit-tmp');
const RAW_EXPORT_PATH = join(TMP_DIR, 'driving-side-raw.png');
const OUTPUT_PATH = join(OUTPUT_DIR, OUTPUT.filename);

const WORLD_MAP = { slug: 'worldRussiaSplit', name: 'World (Russia Split)' } as const;
const PROJECT_SEARCH = 'coolguides driving side';

const VIEWPORT = { width: 1600, height: 1000 } as const;

function log(msg: string): void {
  console.log(`[coolguide-driving-side] ${msg}`);
}

async function login(page: Page, context: BrowserContext): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.locator('input#email').fill(EMAIL);
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();

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
  log('Logged in — session saved');
}

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

async function waitForVisualizerLoggedIn(page: Page, timeoutMs = 30_000): Promise<void> {
  await page
    .locator('[data-i18n-key="visualizer.embed.openButton"]')
    .waitFor({ state: 'visible', timeout: timeoutMs });
}

async function selectAntOption(page: Page, i18nKey: string, optionLabel: string): Promise<void> {
  const select = page
    .locator('.ant-modal:visible')
    .locator(`[data-i18n-key="${i18nKey}"]`)
    .locator('..')
    .locator('..')
    .locator('.ant-select');
  await select.click();
  await page
    .locator('.ant-select-dropdown:visible .ant-select-item-option-content', {
      hasText: optionLabel,
    })
    .first()
    .click();
}

async function closeModal(page: Page): Promise<void> {
  const closeBtn = page.locator('.ant-modal-close:visible').first();
  if (await closeBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await closeBtn.click({ timeout: 5_000 }).catch(() => page.keyboard.press('Escape'));
  } else {
    await page.keyboard.press('Escape');
  }
  await page
    .locator('.ant-modal:visible')
    .waitFor({ state: 'hidden', timeout: 5_000 })
    .catch(() => {});
}

function exportConfigureModal(page: Page): Locator {
  return page
    .locator('.ant-modal:visible')
    .filter({ has: page.locator('[data-i18n-key="visualizer.exportModal.title"]') });
}

function exportCropModal(page: Page): Locator {
  return page
    .locator('.ant-modal:visible')
    .filter({ has: page.locator('[data-i18n-key="visualizer.exportModal.cropAndDownload"]') });
}

function exportPrimaryDownloadButton(modal: Locator): Locator {
  return modal
    .locator('button.ant-btn-primary')
    .filter({ has: modal.page().locator('.anticon-download') })
    .first();
}

async function openOrCreateWorldProject(page: Page, context: BrowserContext): Promise<void> {
  await page.goto(`${BASE_URL}/projects`);
  if (page.url().includes('/login')) {
    log('Session expired — re-logging in');
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
    await searchInput.fill(PROJECT_SEARCH);
    await page.waitForTimeout(600);
    const matchingCard = page.locator('.ant-card').filter({ hasText: PROJECT_SEARCH }).first();
    found = await matchingCard.isVisible({ timeout: 2_000 }).catch(() => false);
    if (found) {
      log('Found existing project — opening');
      await matchingCard.click({ timeout: 10_000 });
    }
  }

  if (!found) {
    log('Creating new World (Russia Split) project');
    await page.goto(`${BASE_URL}/projects/new`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await waitForVisualizerLoggedIn(page);

    const regionInput = page.locator('input[aria-label="Select a country"]');
    await regionInput.waitFor({ timeout: 15_000 });
    await regionInput.click();
    await page.keyboard.type(WORLD_MAP.name, { delay: 40 });
    await page.locator('.ant-select-dropdown:visible').waitFor({ timeout: 5_000 });
    await page
      .locator('.ant-select-dropdown:visible .ant-select-item-option-content', {
        hasText: WORLD_MAP.name,
      })
      .first()
      .click({ timeout: 60_000 });

    await page.waitForLoadState('networkidle', { timeout: 20_000 });
    await page.getByRole('button', { name: 'Switch to static data' }).waitFor({ timeout: 30_000 });

    await page.getByRole('button', { name: 'Save' }).click();
    const saveModal = page.locator('.ant-modal').filter({ hasText: 'Save Project' });
    await saveModal.waitFor({ timeout: 10_000 });
    const nameInput = saveModal.locator('input').first();
    await nameInput.clear();
    await nameInput.fill(PROJECT_SEARCH);
    await page.getByRole('button', { name: 'Create' }).click();
  }

  await page.waitForURL(`${BASE_URL}/projects/**`, { timeout: 15_000 });
  await page
    .locator('[data-i18n-key="visualizer.embed.openButton"]:not([disabled])')
    .waitFor({ timeout: 30_000 });
  log('World project ready');
}

function extractTitlesFromRawSvg(svg: string): string[] {
  const seen = new Set<string>();
  const titles: string[] = [];
  for (const match of svg.matchAll(/title="([^"]+)"/g)) {
    const title = match[1]?.trim();
    if (!title || seen.has(title)) continue;
    seen.add(title);
    titles.push(title);
  }
  if (titles.length === 0) {
    throw new Error('No titles found in captured world SVG');
  }
  return titles.sort((a, b) => a.localeCompare(b));
}

async function readMapRegionTitles(page: Page): Promise<string[]> {
  await page
    .locator('.map-svg-container svg path')
    .first()
    .waitFor({ state: 'attached', timeout: 60_000 });
  await page.waitForTimeout(2_000);

  const cachedSvgPath = join(TMP_DIR, 'worldRussiaSplit.raw.svg');
  if (existsSync(cachedSvgPath)) {
    const svg = readFileSync(cachedSvgPath, 'utf-8');
    const titles = extractTitlesFromRawSvg(svg);
    log(`Found ${titles.length} regions from cached world SVG`);
    return titles;
  }

  // Hard-reload to force the SVG chunk to be fetched again.
  const captured = await new Promise<string | null>((resolve) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, 30_000);

    const handler = async (response: import('playwright').Response): Promise<void> => {
      if (settled) return;
      const url = response.url();
      if (!url.includes('worldRussiaSplit')) return;
      if (!response.ok()) return;
      try {
        const text = await response.text();
        if (text.includes('<svg') && text.includes('title="')) {
          settled = true;
          clearTimeout(timeout);
          page.off('response', handler);
          resolve(text);
        }
      } catch {
        // keep listening
      }
    };

    page.on('response', handler);
    void page.reload({ waitUntil: 'networkidle' });
  });

  if (captured) {
    mkdirSync(TMP_DIR, { recursive: true });
    writeFileSync(cachedSvgPath, captured);
    const titles = extractTitlesFromRawSvg(captured);
    log(`Found ${titles.length} regions from captured world SVG`);
    return titles;
  }

  // Fallback: download sample CSV template (contains region ids).
  log('SVG capture failed — falling back to sample CSV download');
  const downloadBtn = page.getByRole('button', { name: 'Download sample' });
  await downloadBtn.waitFor({ timeout: 10_000 });
  const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
  await downloadBtn.click();
  const download = await downloadPromise;
  const samplePath = join(TMP_DIR, 'world-sample.csv');
  mkdirSync(TMP_DIR, { recursive: true });
  await download.saveAs(samplePath);
  const sampleText = readFileSync(samplePath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = sampleText.trim().split(/\r?\n/).slice(1);
  const fromCsv = lines
    .map((line) => line.split(',')[0]?.trim())
    .filter((id): id is string => Boolean(id));
  if (fromCsv.length === 0) {
    throw new Error('No map region titles found');
  }
  log(`Found ${fromCsv.length} regions from sample CSV`);
  return fromCsv;
}

async function switchToStaticMode(page: Page): Promise<void> {
  const switchBtn = page.getByRole('button', { name: 'Switch to static data' });
  const visible = await switchBtn.isVisible({ timeout: 3_000 }).catch(() => false);
  if (!visible) {
    log('Already in static mode');
    return;
  }
  await switchBtn.click();
  const appeared = await page
    .locator('.ant-modal:visible')
    .filter({ hasText: 'Switch to static data?' })
    .waitFor({ timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
  if (appeared) {
    await page
      .locator('.ant-modal:visible')
      .filter({ hasText: 'Switch to static data?' })
      .getByRole('button', { name: 'Switch', exact: true })
      .click();
  }
  await page
    .locator('.ant-slider')
    .waitFor({ state: 'hidden', timeout: 10_000 })
    .catch(() => {});
}

async function importDrivingSideData(page: Page, regionTitles: string[]): Promise<void> {
  const csvBody = buildDrivingSideCsv(regionTitles);
  const counts = countDrivingSides(regionTitles);
  log(`Traffic counts — left: ${counts.left}, right: ${counts.right}, neutral: ${counts.neutral}`);

  const tabDelimitedRadio = page.locator('input[type="radio"][value="tab_delimited"]');
  await tabDelimitedRadio.waitFor({ timeout: 15_000 });
  await tabDelimitedRadio.check({ force: true });

  const editTextBtn = page.locator('[data-i18n-key="visualizer.importData.editManuallyInText"]');
  await editTextBtn.waitFor({ timeout: 10_000 });
  await editTextBtn.click();

  const modal = page.locator('.ant-modal:visible').last();
  await modal.waitFor({ timeout: 10_000 });
  const textarea = modal.locator('textarea').first();
  await textarea.waitFor({ timeout: 5_000 });
  await textarea.fill(csvBody);
  await modal.getByRole('button', { name: 'Save' }).click();
  await modal.waitFor({ state: 'hidden', timeout: 15_000 });

  await page
    .locator('.ant-message-notice', { hasText: /imported/i })
    .waitFor({ timeout: 15_000 })
    .catch(() => {});
  await page.waitForTimeout(1_500);
  log('Driving-side data imported');
}

async function collapseRightPanel(page: Page): Promise<void> {
  const collapseBtn = page.locator('.ant-splitter-bar-collapse-bar-end').last();
  if (await collapseBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await collapseBtn.click();
    await page.waitForTimeout(400);
  }
}

async function expandCollapse(page: Page, i18nKey: string): Promise<void> {
  const collapse = page.locator(`[data-i18n-key="${i18nKey}"]`).first();
  if (await collapse.isVisible({ timeout: 2_000 }).catch(() => false)) {
    const expanded = await collapse
      .locator('xpath=ancestor::div[contains(@class,"ant-collapse-item-active")]')
      .isVisible()
      .catch(() => false);
    if (!expanded) {
      await collapse.click();
      await page.waitForTimeout(250);
    }
  }
}

function legendRangesSection(page: Page): Locator {
  return page
    .locator('[data-i18n-key="visualizer.legendConfig.collapseRanges"]')
    .locator('xpath=ancestor::div[contains(@class,"ant-collapse-item")]');
}

function legendRangeRow(page: Page, rowIndex: number): Locator {
  const nameInput = legendRangesSection(page)
    .locator('[aria-label="Legend item name"]')
    .nth(rowIndex);
  return nameInput.locator('xpath=ancestor::div[@data-id][1]');
}

function legendRemoveButtons(page: Page): Locator {
  return legendRangesSection(page).locator('[aria-label="Remove legend item"]');
}

async function setInputNumberInPanel(
  page: Page,
  rowIndex: number,
  field: 'min' | 'max',
  value: number,
): Promise<void> {
  const row = legendRangeRow(page, rowIndex);
  const input = row.locator('.ant-input-number-input').nth(field === 'min' ? 0 : 1);
  await input.click({ clickCount: 3 });
  await input.fill(String(value));
  await input.press('Tab');
}

async function setLegendRowName(page: Page, rowIndex: number, name: string): Promise<void> {
  const nameInput = legendRangeRow(page, rowIndex).locator('[aria-label="Legend item name"]');
  await nameInput.click({ clickCount: 3 });
  await nameInput.fill(name);
  await nameInput.press('Tab');
}

async function setLegendRowColor(page: Page, rowIndex: number, hex: string): Promise<void> {
  const row = legendRangeRow(page, rowIndex);
  const trigger = row.locator('.ant-color-picker-trigger').first();
  await trigger.click();
  const hexInput = page.locator('.ant-color-picker-input input').last();
  await hexInput.waitFor({ timeout: 5_000 });
  await hexInput.click({ clickCount: 3 });
  await hexInput.fill(hex);
  await hexInput.press('Enter');
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(200);
}

async function configureLegend(page: Page, counts: { left: number; right: number }): Promise<void> {
  const labels = drivingSideLegendLabels(counts);
  await expandCollapse(page, 'visualizer.legendConfig.collapseRanges');

  for (let attempt = 0; attempt < 6; attempt++) {
    const count = await legendRemoveButtons(page).count();
    if (count <= 2) break;
    await legendRemoveButtons(page).last().click();
    await page.waitForTimeout(250);
  }

  await setLegendRowName(page, 0, labels.leftLabel);
  await setLegendRowName(page, 1, labels.rightLabel);
  await setInputNumberInPanel(page, 0, 'min', 1);
  await setInputNumberInPanel(page, 0, 'max', 1);
  await setInputNumberInPanel(page, 1, 'min', 2);
  await setInputNumberInPanel(page, 1, 'max', 2);
  await setLegendRowColor(page, 0, DRIVING_SIDE_COLORS.left);
  await setLegendRowColor(page, 1, DRIVING_SIDE_COLORS.right);

  await expandCollapse(page, 'visualizer.legendStyles.collapseTitle');
  const titleShowSwitch = page
    .locator('[data-i18n-key="visualizer.legendStyles.collapseTitle"]')
    .locator('xpath=ancestor::div[contains(@class,"ant-collapse-item")]')
    .locator('button[role="switch"]')
    .first();
  if ((await titleShowSwitch.getAttribute('aria-checked')) === 'true') {
    await titleShowSwitch.click();
  }

  const floatingOption = page.locator('label').filter({ hasText: 'Floating' }).first();
  if (await floatingOption.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await floatingOption.click();
  }

  const noDataPicker = page
    .locator('[data-i18n-key="visualizer.legendStyles.noDataColorLabel"]')
    .locator('..')
    .locator('..')
    .locator('.ant-color-picker-trigger')
    .first();
  if (await noDataPicker.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await noDataPicker.click();
    const hexInput = page.locator('.ant-color-picker-input input').last();
    await hexInput.click({ clickCount: 3 });
    await hexInput.fill(DRIVING_SIDE_COLORS.neutral);
    await hexInput.press('Enter');
    await page.keyboard.press('Escape').catch(() => {});
  }

  log('Legend configured');
}

async function configureMapStyles(page: Page): Promise<void> {
  await expandCollapse(page, 'visualizer.mapStyles.collapseBackground');

  const transparentSwitch = page.getByRole('switch', { name: 'Transparent' });
  if ((await transparentSwitch.getAttribute('aria-checked')) === 'true') {
    await transparentSwitch.click();
  }

  const showWatermarkSwitch = page.getByRole('switch', { name: 'Show watermark' });
  if ((await showWatermarkSwitch.getAttribute('aria-checked')) !== 'true') {
    await showWatermarkSwitch.click();
  }

  log('Map styles configured');
}

async function exportRawPng(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Export' }).click();
  const configureModal = exportConfigureModal(page);
  await configureModal.waitFor({ timeout: 10_000 });

  await selectAntOption(page, 'visualizer.exportModal.exportTypeLabel', 'PNG');

  const qualityInput = configureModal
    .locator('[data-i18n-key="visualizer.exportModal.qualityLabel"]')
    .locator('..')
    .locator('..')
    .locator('.ant-input-number-input');
  await qualityInput.click({ clickCount: 3 });
  await qualityInput.fill('100');
  await qualityInput.press('Tab');

  await configureModal
    .locator('[data-i18n-key="visualizer.exportModal.nextCropAndDownload"]')
    .click();
  const cropModal = exportCropModal(page);
  await cropModal.waitFor({ timeout: 30_000 });

  await cropModal
    .locator('.ant-spin')
    .waitFor({ state: 'hidden', timeout: 120_000 })
    .catch(() => {});
  await page.waitForTimeout(500);

  const tier2k = cropModal.getByText('2K', { exact: true });
  const tier1080 = cropModal.getByText('1080p', { exact: true });
  if (await tier2k.isVisible({ timeout: 3_000 }).catch(() => false)) {
    const disabled = await tier2k.evaluate((el) => {
      const item = el.closest('.ant-segmented-item');
      return item?.classList.contains('ant-segmented-item-disabled') ?? false;
    });
    if (!disabled) {
      await tier2k.click();
      log('Export tier: 2K');
    } else {
      await tier1080.click();
      log('2K locked on this plan — using 1080p');
    }
  } else {
    await tier1080.click();
    log('Export tier: 1080p');
  }

  const aspect169 = cropModal.getByText('16:9', { exact: true });
  if (await aspect169.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await aspect169.click();
    log('Crop aspect: 16:9');
  }

  const downloadBtn = exportPrimaryDownloadButton(cropModal);
  await downloadBtn.waitFor({ timeout: 30_000 });

  mkdirSync(TMP_DIR, { recursive: true });
  const downloadPromise = page.waitForEvent('download', { timeout: 120_000 });
  await downloadBtn.click();
  const download = await downloadPromise;
  await download.saveAs(RAW_EXPORT_PATH);
  log(`Raw export saved → ${RAW_EXPORT_PATH}`);

  await closeModal(page);
}

async function compositeFinalImage(context: BrowserContext): Promise<void> {
  const rawBase64 = readFileSync(RAW_EXPORT_PATH).toString('base64');
  const page = await context.newPage();
  await page.setViewportSize({ width: OUTPUT.width, height: OUTPUT.height });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: ${OUTPUT.width}px;
      height: ${OUTPUT.height}px;
      background: #ffffff;
      font-family: Montserrat, system-ui, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .title-bar {
      flex: 0 0 88px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 48px;
      border-bottom: 1px solid #e2e8f0;
    }
    .title-bar h1 {
      font-size: 40px;
      font-weight: 600;
      color: #18294d;
      text-align: center;
      line-height: 1.15;
    }
    .map-area {
      position: relative;
      flex: 1;
      min-height: 0;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px 16px 36px;
    }
    .map-area img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .source {
      position: absolute;
      left: 28px;
      bottom: 10px;
      font-size: 18px;
      color: #5b6472;
    }
  </style>
</head>
<body>
  <div class="title-bar">
    <h1>${escapeHtml(DRIVING_SIDE_LEGEND.mapTitle)}</h1>
  </div>
  <div class="map-area">
    <img src="data:image/png;base64,${rawBase64}" alt="World driving side map" />
    <div class="source">${escapeHtml(DRIVING_SIDE_LEGEND.sourceLine)}</div>
  </div>
</body>
</html>`;

  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  await page.screenshot({ path: OUTPUT_PATH, type: 'png' });
  await page.close();
  log(`Final asset saved → ${OUTPUT_PATH}`);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function main(): Promise<void> {
  if (!BASE_URL || !EMAIL || !PASSWORD) {
    console.error(
      'Missing config. Set CLIENT_URL, REGIONIFY_EMAIL, REGIONIFY_PASSWORD in marketing/.env',
    );
    process.exit(1);
  }

  const headed = process.argv.includes('--headed');
  const browser = await chromium.launch({ headless: !headed, slowMo: headed ? 60 : 0 });
  const context = await ensureAuthedContext(browser);
  const page = await context.newPage();

  try {
    await page.setViewportSize(VIEWPORT);
    await openOrCreateWorldProject(page, context);
    await switchToStaticMode(page);

    const regionTitles = await readMapRegionTitles(page);
    writeFileSync(
      join(TMP_DIR, 'world-region-titles.json'),
      `${JSON.stringify(regionTitles, null, 2)}\n`,
    );
    const sideCounts = countDrivingSides(regionTitles);

    await importDrivingSideData(page, regionTitles);
    await configureLegend(page, { left: sideCounts.left, right: sideCounts.right });
    await configureMapStyles(page);
    await collapseRightPanel(page);

    await page.setViewportSize({ width: 1920, height: 900 });
    await page.waitForTimeout(2_000);

    await exportRawPng(page);
    await compositeFinalImage(context);

    console.log(`\n✅  Reddit coolguide asset ready: ${OUTPUT_PATH}`);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

main().catch((err: unknown) => {
  console.error('\n✗  Script failed:', err);
  process.exit(1);
});
