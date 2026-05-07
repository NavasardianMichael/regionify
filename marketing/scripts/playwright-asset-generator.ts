import os from 'node:os';
import { chromium, type BrowserContext, type Locator, type Page } from 'playwright';
import { config as loadEnv } from 'dotenv';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { MARKETING_COUNTRIES, type MarketingCountry } from 'scripts/countries';

const __dirname = dirname(fileURLToPath(import.meta.url));

loadEnv({ path: join(__dirname, '..', '.env') });

const BASE_URL = (process.env.CLIENT_URL ?? '').replace(/\/$/, '');
const EMAIL = process.env.REGIONIFY_EMAIL ?? '';
const PASSWORD = process.env.REGIONIFY_PASSWORD ?? '';
const ASSETS_ROOT = join(__dirname, '..', 'assets');
// Persisted auth cookies — reused across runs to avoid hitting the login rate limiter.
const AUTH_STATE_FILE = join(ASSETS_ROOT, '.auth-state.json');
const SHOWCASE_EMBED_URLS_JSON = join(__dirname, '..', 'data', 'showcase-embed-urls.json');
// Add or remove countries here. All other code stays the same.

function recordShowcaseEmbedUrl(slug: string, url: string): void {
  let map: Record<string, string> = {};
  if (existsSync(SHOWCASE_EMBED_URLS_JSON)) {
    map = JSON.parse(readFileSync(SHOWCASE_EMBED_URLS_JSON, 'utf-8')) as Record<string, string>;
  }
  map[slug] = url;
  writeFileSync(SHOWCASE_EMBED_URLS_JSON, `${JSON.stringify(map, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function logForCountry(countryName: string, message: string): void {
  console.log(`[${countryName}]: ${message}`);
}

function warnForCountry(countryName: string, message: string): void {
  console.warn(`[${countryName}]: ${message}`);
}

/** Click an Ant Design Select whose label carries a data-i18n-key, then pick option. */
async function selectAntOption(page: Page, i18nKey: string, optionLabel: string): Promise<void> {
  // DOM structure: Typography.Text[data-i18n-key] → .. (inner Flex) → .. (outer Flex) → .ant-select
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

/** Turn an Ant Design Switch ON if it is currently OFF. */
async function switchOn(switchEl: ReturnType<Page['locator']>): Promise<void> {
  await switchEl.waitFor({ timeout: 5_000 });
  if ((await switchEl.getAttribute('aria-checked')) !== 'true') {
    await switchEl.click();
  }
}

async function closeModal(page: Page): Promise<void> {
  const closeBtn = page.locator('.ant-modal-close:visible').first();
  if (await closeBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await closeBtn.click({ timeout: 5_000 }).catch(() => page.keyboard.press('Escape'));
  } else {
    await page.keyboard.press('Escape');
  }
  const closed = await page
    .locator('.ant-modal:visible')
    .waitFor({ state: 'hidden', timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  if (!closed) {
    await page.keyboard.press('Escape');
    await page
      .locator('.ant-modal:visible')
      .waitFor({ state: 'hidden', timeout: 5_000 })
      .catch(() => {});
  }
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts: number, label: string): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt < maxAttempts) {
        console.warn(
          `[retry ${attempt}/${maxAttempts - 1}] ${label}: ${err instanceof Error ? err.message : String(err)}`,
        );
        await new Promise((r) => setTimeout(r, 2_000));
      } else {
        throw err;
      }
    }
  }
  throw new Error('unreachable');
}

/** Export modal step 1 — title uses stable `data-i18n-key` (works in any UI locale). */
function exportConfigureModal(page: Page): Locator {
  return page
    .locator('.ant-modal:visible')
    .filter({ has: page.locator('[data-i18n-key="visualizer.exportModal.title"]') });
}

/** Export modal crop step — distinct title key from configure step. */
function exportCropModal(page: Page): Locator {
  return page
    .locator('.ant-modal:visible')
    .filter({ has: page.locator('[data-i18n-key="visualizer.exportModal.cropAndDownload"]') });
}

/** Primary download control (skips "Next" which uses a different icon). */
function exportPrimaryDownloadButton(modal: Locator): Locator {
  return modal
    .locator('button.ant-btn-primary')
    .filter({ has: modal.page().locator('.anticon-download') })
    .first();
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

async function login(page: Page, context: BrowserContext): Promise<void> {
  await page.goto(`${BASE_URL}/login`);

  // Ant Design Form.Item name="email" → <input id="email">
  await page.locator('input#email').fill(EMAIL);
  // Input.Password uses autoComplete="current-password"
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();

  // TODO: re-enable once rate limit expires
  // const rateLimitMsg = page.locator('text=Too many authentication attempts');
  // const rateLimited = await rateLimitMsg.waitFor({ timeout: 2_000 }).then(() => true).catch(() => false);
  // if (rateLimited) {
  //   throw new Error('Login rate-limited. Wait a few minutes then retry.');
  // }

  // Handle "maximum devices" session limit — evict all other sessions if the button appears
  const evictBtn = page.getByRole('button', { name: 'Sign in and log out from all other devices' });
  const evictAppeared = await evictBtn
    .waitFor({ timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
  if (evictAppeared) {
    console.log('  → Session limit hit — evicting other devices…');
    await evictBtn.click();
  }

  // Wait until we leave the login page
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
  // Let the app finish fetching the session and hydrating the auth store
  // before any further navigation — prevents the "Login to Save" race condition.
  await page.waitForLoadState('networkidle', { timeout: 15_000 });
  await page.waitForTimeout(1_000);

  // Persist cookies so subsequent runs skip the login form entirely
  mkdirSync(ASSETS_ROOT, { recursive: true });
  await context.storageState({ path: AUTH_STATE_FILE });
  console.log(`✓ Logged in — ${page.url()} (session saved)`);
}

// ---------------------------------------------------------------------------
// Create project
// ---------------------------------------------------------------------------

/** Session + profile must be ready or Save runs "Login to Save" and redirects to /login. */
async function waitForVisualizerLoggedIn(page: Page, timeoutMs: number): Promise<void> {
  // Embed button mounts only when `isLoggedIn` (see VisualizerPage); locale-independent key.
  await page
    .locator('[data-i18n-key="visualizer.embed.openButton"]')
    .waitFor({ state: 'visible', timeout: timeoutMs });
}

async function openOrCreateProject(
  page: Page,
  context: BrowserContext,
  country: MarketingCountry,
): Promise<void> {
  // Search the projects listing for an existing project before creating a new one.
  await page.goto(`${BASE_URL}/projects`);
  if (page.url().includes('/login')) {
    console.log(`  → Worker session expired mid-run — re-logging in…`);
    await login(page, context);
    await page.goto(`${BASE_URL}/projects`);
  }
  await page.waitForLoadState('networkidle', { timeout: 15_000 });

  // Ant Design Input.Search may forward data-* props to the <input> itself or to a wrapper span.
  // The CSS comma selector matches either DOM structure without a second round-trip.
  const searchInput = page
    .locator(
      'input[data-i18n-key="projects.searchPlaceholder"], [data-i18n-key="projects.searchPlaceholder"] input',
    )
    .first();
  await searchInput.waitFor({ timeout: 10_000 });
  await searchInput.fill(country.name);
  // Allow the 300 ms client-side debounce to fire and cards to re-render.
  await page.waitForTimeout(600);

  // Default sort is "recently updated first" — the first result is the most recent project.
  const matchingCard = page.locator('.ant-card').filter({ hasText: country.name }).first();
  const found = await matchingCard.isVisible({ timeout: 2_000 }).catch(() => false);

  if (found) {
    logForCountry(country.name, '→ Found existing project — opening it');
    await matchingCard.click({ timeout: 10_000 });
  } else {
    logForCountry(country.name, '→ No existing project — creating new one');
    await page.goto(`${BASE_URL}/projects/new`);
    if (page.url().includes('/login')) {
      await login(page, context);
      await page.goto(`${BASE_URL}/projects/new`);
    }
    await waitForVisualizerLoggedIn(page, 30_000);
    await page.locator('input[aria-label="Select a country"]').waitFor({ timeout: 15_000 });

    const regionInput = page.locator('input[aria-label="Select a country"]');
    await regionInput.click();
    await page.keyboard.type(country.name, { delay: 50 });
    await page.locator('.ant-select-dropdown:visible').waitFor({ timeout: 5_000 });
    await page
      .locator('.ant-select-dropdown:visible .ant-select-item-option-content', {
        hasText: country.name,
      })
      .first()
      .click({ timeout: 60_000 });

    await page.waitForLoadState('networkidle', { timeout: 20_000 });
    await page.getByRole('button', { name: 'Switch to static data' }).waitFor({ timeout: 30_000 });
    logForCountry(country.name, '✓ Country selected — sample data loaded');

    // The Save modal pre-fills the input with the localized region label (country name).
    // Click Save to open the modal, then Create to save with the app's default name.
    await page.getByRole('button', { name: 'Save' }).click();
    await page
      .locator('.ant-modal')
      .filter({ hasText: 'Save Project' })
      .waitFor({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Create' }).click();
  }

  // Wait for the project URL and for the Zustand store to hydrate (isAwaitingProjectFromUrl → false).
  // The Embed button being enabled is the reliable signal that currentProjectId !== null.
  await page.waitForURL(`${BASE_URL}/projects/**`, { timeout: 15_000 });
  await page
    .locator('[data-i18n-key="visualizer.embed.openButton"]:not([disabled])')
    .waitFor({ timeout: 30_000 });
  logForCountry(country.name, '✓ Project ready');
}

// ---------------------------------------------------------------------------
// Export animated: GIF or MP4 (dynamic mode)
// ---------------------------------------------------------------------------

/** Quality used for animated exports — 2× scale keeps files manageable and renders fast. */
const ANIMATED_EXPORT_QUALITY = 50;

/**
 * Set the Ant Design InputNumber identified by its adjacent label's data-i18n-key.
 * Clears the current value then types the new one, finishing with Tab to fire onBlur.
 */
async function setInputNumberByLabel(page: Page, i18nKey: string, value: number): Promise<void> {
  const modal = page.locator('.ant-modal:visible');
  const input = modal
    .locator(`[data-i18n-key="${i18nKey}"]`)
    .locator('..')
    .locator('..')
    .locator('.ant-input-number-input');
  await input.click({ clickCount: 3 });
  await input.fill(String(value));
  await input.press('Tab');
}

async function exportAnimated(
  page: Page,
  assetsDir: string,
  slug: string,
  format: 'GIF' | 'MP4',
  countryName: string,
): Promise<void> {
  // Option labels as rendered in the export type dropdown
  const isGif = format === 'GIF';
  const optionLabel = isGif ? 'GIF (Animation)' : 'Video (MP4)';
  const fileName = isGif ? `${slug}-animation.gif` : `${slug}-video.mp4`;

  await page.getByRole('button', { name: 'Export' }).click();
  const configureModal = exportConfigureModal(page);
  await configureModal.waitFor({ timeout: 10_000 });

  await selectAntOption(page, 'visualizer.exportModal.exportTypeLabel', optionLabel);

  // Lower quality before rendering: qualityToScale(50) = 2× vs 4× at quality 100.
  // Cuts per-frame pixel count by 4× so large-region countries (Brazil, Russia) finish well
  // within the download timeout without visible quality loss in marketing showcase assets.
  await setInputNumberByLabel(page, 'visualizer.exportModal.qualityLabel', ANIMATED_EXPORT_QUALITY);

  // GIF: crop step then download. MP4: direct download on configure step (skip crop).
  if (isGif) {
    await configureModal
      .locator('[data-i18n-key="visualizer.exportModal.nextCropAndDownload"]')
      .click();
    await exportCropModal(page).waitFor({ timeout: 15_000 });
  }

  const downloadRoot = isGif ? exportCropModal(page) : configureModal;
  const downloadBtn = exportPrimaryDownloadButton(downloadRoot);
  await downloadBtn.waitFor({ timeout: 30_000 });

  // Register download listener BEFORE clicking to avoid race condition.
  // 300 s covers quality-50 rendering even for large countries like India.
  const downloadPromise = page.waitForEvent('download', { timeout: 300_000 });
  await downloadBtn.click();
  const download = await downloadPromise;
  await download.saveAs(join(assetsDir, fileName));
  logForCountry(countryName, `✓ ${format} → ${fileName}`);

  await closeModal(page);
}

// ---------------------------------------------------------------------------
// Set map background to transparent (must be done before any export)
// ---------------------------------------------------------------------------

async function setTransparentBackground(page: Page, countryName: string): Promise<void> {
  // The Transparent switch lives in the Background collapse of the right styles panel.
  const transparentSwitch = page.getByRole('switch', { name: 'Transparent' });

  // Expand the Background collapse section if the switch isn't already visible
  if (!(await transparentSwitch.isVisible().catch(() => false))) {
    await page.locator('[data-i18n-key="visualizer.mapStyles.collapseBackground"]').first().click();
    await transparentSwitch.waitFor({ timeout: 5_000 });
  }

  await switchOn(transparentSwitch);
  logForCountry(countryName, '✓ Background set to transparent');
}

// ---------------------------------------------------------------------------
// Collapse the right styles panel — widens the map area for better export aspect ratio
// ---------------------------------------------------------------------------

async function closeRightPanel(page: Page): Promise<void> {
  // The collapse button on the right (styles) panel uses .ant-splitter-bar-collapse-bar-end
  // and is always visible (no hover required).
  const collapseBtn = page.locator('.ant-splitter-bar-collapse-bar-end').last();
  const visible = await collapseBtn.isVisible({ timeout: 3_000 }).catch(() => false);
  if (visible) {
    await collapseBtn.click();
    await page.waitForTimeout(500);
  }
}

// ---------------------------------------------------------------------------
// Normalize legend ranges to fit current sample data
// ---------------------------------------------------------------------------

async function normalizeRanges(page: Page, countryName: string): Promise<void> {
  // The normalize button lives inside the "Ranges" collapse, which is closed by default.
  const btn = page.getByRole('button', {
    name: 'Distribute ranges evenly between current data min and max',
  });

  if (!(await btn.isVisible().catch(() => false))) {
    await page.locator('[data-i18n-key="visualizer.legendConfig.collapseRanges"]').click();
    await btn.waitFor({ timeout: 5_000 });
  }

  await btn.click();
  logForCountry(countryName, '✓ Legend ranges normalized');
}

// ---------------------------------------------------------------------------
// Switch visualizer to static data mode
// ---------------------------------------------------------------------------

async function switchToStaticMode(page: Page, countryName: string): Promise<void> {
  // The button aria-label is "Switch to static data" (visualizer.importData.switchAriaToStatic)
  const switchBtn = page.getByRole('button', { name: 'Switch to static data' });
  await switchBtn.waitFor({ timeout: 10_000 });
  await switchBtn.click();

  // A confirmation dialog may appear when data is present
  const appeared = await page
    .locator('.ant-modal:visible')
    .filter({ hasText: 'Switch to static data?' })
    .waitFor({ timeout: 3_000 })
    .then(() => true)
    .catch(() => false);

  if (appeared) {
    // Scope to the confirmation modal to avoid matching the toolbar "Switch to static data" icon button
    await page
      .locator('.ant-modal:visible')
      .filter({ hasText: 'Switch to static data?' })
      .getByRole('button', { name: 'Switch', exact: true })
      .click();
  }

  // In static mode the timeline slider is hidden — wait for it to disappear
  await page
    .locator('.ant-slider')
    .waitFor({ state: 'hidden', timeout: 10_000 })
    .catch(() => {});
  logForCountry(countryName, '✓ Switched to static mode');
}

async function switchToDynamicMode(page: Page, countryName: string): Promise<void> {
  // The button aria-label is "Switch to dynamic data" (visualizer.importData.switchAriaToDynamic)
  const switchBtn = page.getByRole('button', { name: 'Switch to dynamic data' });
  await switchBtn.waitFor({ timeout: 10_000 });
  await switchBtn.click();

  const appeared = await page
    .locator('.ant-modal:visible')
    .filter({ hasText: 'Switch to dynamic data?' })
    .waitFor({ timeout: 3_000 })
    .then(() => true)
    .catch(() => false);

  if (appeared) {
    await page
      .locator('.ant-modal:visible')
      .filter({ hasText: 'Switch to dynamic data?' })
      .getByRole('button', { name: 'Switch', exact: true })
      .click();
  }

  // In dynamic mode the timeline slider becomes visible again
  await page
    .locator('.ant-slider')
    .waitFor({ state: 'visible', timeout: 15_000 })
    .catch(() => {});
  logForCountry(countryName, '✓ Switched to dynamic mode');
}

// ---------------------------------------------------------------------------
// Export SVG + PNG in one modal session (avoids React state reset on reopen)
// ---------------------------------------------------------------------------

async function exportStaticAssets(
  page: Page,
  assetsDir: string,
  slug: string,
  countryName: string,
  skipPng: boolean,
  skipSvg: boolean,
): Promise<void> {
  if (!skipPng) {
    await page.getByRole('button', { name: 'Export' }).click();
    const configModal = exportConfigureModal(page);
    await configModal.waitFor({ timeout: 10_000 });
    await selectAntOption(page, 'visualizer.exportModal.exportTypeLabel', 'PNG');
    await configModal
      .locator('[data-i18n-key="visualizer.exportModal.nextCropAndDownload"]')
      .click();
    const cropModal = exportCropModal(page);
    await cropModal.waitFor({ timeout: 30_000 });
    const pngBtn = exportPrimaryDownloadButton(cropModal);
    await pngBtn.waitFor({ timeout: 30_000 });
    const pngDl = page.waitForEvent('download', { timeout: 60_000 });
    await pngBtn.click();
    await (await pngDl).saveAs(join(assetsDir, `${slug}-static.png`));
    logForCountry(countryName, `✓ PNG → ${slug}-static.png`);
    await closeModal(page).catch(() => {});
  } else {
    logForCountry(countryName, `⏭ PNG already exists — skipping`);
  }

  if (!skipSvg) {
    await page.getByRole('button', { name: 'Export' }).click();
    const configModal = exportConfigureModal(page);
    await configModal.waitFor({ timeout: 10_000 });
    await selectAntOption(page, 'visualizer.exportModal.exportTypeLabel', 'SVG');
    const svgBtn = exportPrimaryDownloadButton(configModal);
    await svgBtn.waitFor({ timeout: 30_000 });
    const svgDl = page.waitForEvent('download', { timeout: 60_000 });
    await svgBtn.click();
    await (await svgDl).saveAs(join(assetsDir, `${slug}.svg`));
    logForCountry(countryName, `✓ SVG → ${slug}.svg`);
    await closeModal(page);
  } else {
    logForCountry(countryName, `⏭ SVG already exists — skipping`);
  }
}

// ---------------------------------------------------------------------------
// Enable public embed and return the full embed page URL
// ---------------------------------------------------------------------------

async function setupEmbed(page: Page, country: MarketingCountry): Promise<string> {
  await page.getByRole('button', { name: 'Embed' }).click();
  const modal = page.locator('.ant-modal:visible').filter({ hasText: 'Public map embed' });
  await modal.waitFor({ timeout: 10_000 });

  // Ant Design Form.Item name="enabled"  → button#enabled[role="switch"]
  await switchOn(modal.locator('button#enabled[role="switch"]'));

  // Required: SEO title (Form.Item name="seoTitle" → input#seoTitle)
  const titleInput = modal.locator('input#seoTitle');
  await titleInput.clear();
  await titleInput.fill(`${country.name} Choropleth Map | Regionify`);

  // Required: SEO description (Form.Item name="seoDescription" → textarea#seoDescription)
  const descInput = modal.locator('textarea#seoDescription');
  await descInput.clear();
  await descInput.fill(
    `Explore ${country.name} choropleth maps with regional statistics and animated data visualizations.`,
  );

  // Allow embedding from any origin (includes localhost:7002 for local dev)
  // Form.Item name="allowedOriginsAllowAll" → button#allowedOriginsAllowAll[role="switch"]
  await switchOn(modal.locator('button#allowedOriginsAllowAll[role="switch"]'));

  // Save button uses t('visualizer.save') and data-i18n-key="visualizer.save"
  await modal.locator('[data-i18n-key="visualizer.save"]').click();
  await page
    .locator('.ant-message-notice', { hasText: 'Embed settings saved' })
    .waitFor({ timeout: 10_000 });
  logForCountry(country.name, '✓ Embed saved');

  // After save the embed URL appears as an <a href="..."> (AppNavLink → React Router NavLink)
  const embedLink = modal.locator('a[href*="/embed/"]');
  await embedLink.waitFor({ timeout: 10_000 });
  const href = (await embedLink.getAttribute('href')) ?? '';
  const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
  logForCountry(country.name, `✓ Embed URL: ${fullUrl}`);
  return fullUrl;
}

// ---------------------------------------------------------------------------
// Open the public embed page in a new tab and screenshot it
// ---------------------------------------------------------------------------

async function screenshotEmbedPage(
  context: BrowserContext,
  embedUrl: string,
  assetsDir: string,
  slug: string,
  countryName: string,
): Promise<void> {
  const embedPage = await context.newPage();
  await embedPage.goto(embedUrl, { waitUntil: 'networkidle', timeout: 30_000 });
  // Give the map canvas extra time to finish painting
  await embedPage.waitForTimeout(4_000);
  await embedPage.screenshot({ path: join(assetsDir, `${slug}-embed-page.png`), fullPage: true });
  await embedPage.close();
  logForCountry(countryName, `✓ Embed page screenshot → ${slug}-embed-page.png`);
}

// ---------------------------------------------------------------------------
// Per-country orchestrator
// ---------------------------------------------------------------------------

async function generateAssetsForCountry(
  page: Page,
  context: BrowserContext,
  country: MarketingCountry,
): Promise<void> {
  const assetsDir = join(ASSETS_ROOT, country.slug);
  mkdirSync(assetsDir, { recursive: true });
  const { slug } = country;

  const skipGif = existsSync(join(assetsDir, `${slug}-animation.gif`));
  const skipMp4 = existsSync(join(assetsDir, `${slug}-video.mp4`));
  const skipPng = existsSync(join(assetsDir, `${slug}-static.png`));
  const skipSvg = existsSync(join(assetsDir, `${slug}.svg`));
  const embedUrlPath = join(assetsDir, `${slug}-embed-url.txt`);
  const skipEmbed = existsSync(embedUrlPath);
  const skipEmbedScreenshot = existsSync(join(assetsDir, `${slug}-embed-page.png`));

  if (skipGif && skipMp4 && skipPng && skipSvg && skipEmbed && skipEmbedScreenshot) {
    console.log('');
    logForCountry(country.name, '⏭ All assets already exist — skipping');
    return;
  }

  console.log('');
  logForCountry(country.name, '▶ starting');

  await openOrCreateProject(page, context, country);

  await setTransparentBackground(page, country.name);
  await closeRightPanel(page);

  const needsDynamic = !skipGif || !skipMp4;
  const needsStatic = !skipPng || !skipSvg;

  if (needsDynamic) {
    const inDynamic = await page
      .getByRole('button', { name: 'Switch to static data' })
      .isVisible({ timeout: 2_000 })
      .catch(() => false);
    if (!inDynamic) {
      await switchToDynamicMode(page, country.name);
    }
    await normalizeRanges(page, country.name);
    if (!skipGif) {
      await exportAnimated(page, assetsDir, slug, 'GIF', country.name);
    } else {
      logForCountry(country.name, `⏭ GIF already exists — skipping`);
    }
    if (!skipMp4) {
      await exportAnimated(page, assetsDir, slug, 'MP4', country.name);
    } else {
      logForCountry(country.name, `⏭ MP4 already exists — skipping`);
    }
  }

  if (needsStatic) {
    const inStatic = await page
      .getByRole('button', { name: 'Switch to dynamic data' })
      .isVisible({ timeout: 2_000 })
      .catch(() => false);
    if (!inStatic) {
      await switchToStaticMode(page, country.name);
    } else {
      logForCountry(country.name, '✓ Already in static mode');
    }
    await normalizeRanges(page, country.name);
    await exportStaticAssets(page, assetsDir, slug, country.name, skipPng, skipSvg);
  }

  let embedUrl: string;
  if (!skipEmbed) {
    embedUrl = await setupEmbed(page, country);
    writeFileSync(embedUrlPath, embedUrl);
    recordShowcaseEmbedUrl(slug, embedUrl);
  } else {
    embedUrl = readFileSync(embedUrlPath, 'utf-8').trim();
    logForCountry(country.name, `⏭ Embed already configured — skipping`);
  }

  if (!skipEmbedScreenshot) {
    await screenshotEmbedPage(context, embedUrl, assetsDir, slug, country.name);
  } else {
    logForCountry(country.name, `⏭ Embed screenshot already exists — skipping`);
  }

  // showHeader toggle — the embed modal is still open from setupEmbed above
  if (!skipEmbed) {
    const embedModal = page.locator('.ant-modal:visible').filter({ hasText: 'Public map embed' });
    const showHeaderSwitch = embedModal.locator('button#showHeader[role="switch"]');
    await showHeaderSwitch.waitFor({ timeout: 5_000 });
    if ((await showHeaderSwitch.getAttribute('aria-checked')) === 'true') {
      await showHeaderSwitch.click();
      await embedModal.locator('[data-i18n-key="visualizer.save"]').click();
      const saveToast = page
        .locator('.ant-message-notice')
        .filter({ hasText: /embed settings saved/i });
      const toastVisible = await saveToast
        .waitFor({ timeout: 6_000 })
        .then(() => true)
        .catch(() => false);
      if (!toastVisible) {
        warnForCountry(
          country.name,
          '→ Save toast not detected; continuing after short settle wait.',
        );
        await page.waitForTimeout(1_000);
      }
    }
    await closeModal(page);
  }

  logForCountry(country.name, '✓ Done');
}

// ---------------------------------------------------------------------------
// Worker: owns one browser context and processes its slice of countries
// ---------------------------------------------------------------------------

async function runWorker(
  workerId: number,
  marketingCountries: MarketingCountry[],
  browser: Awaited<ReturnType<typeof chromium.launch>>,
): Promise<string[]> {
  const tag = `[worker ${workerId}]`;
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 900 },
    storageState: AUTH_STATE_FILE,
  });
  const page = await context.newPage();
  const failed: string[] = [];

  try {
    for (const country of marketingCountries) {
      logForCountry(country.name, `${tag} worker slice started`);
      try {
        await withRetry(() => generateAssetsForCountry(page, context, country), 2, country.name);
        logForCountry(country.name, `${tag} worker slice finished`);
      } catch (err) {
        console.error(`\n[${country.name}]: ✗ Failed after retries — skipping.\n`, err);
        failed.push(country.slug);
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(1_000).catch(() => {});
      }
    }
  } finally {
    await context.close();
  }

  return failed;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  if (!EMAIL || !PASSWORD) {
    console.error('Set REGIONIFY_EMAIL and REGIONIFY_PASSWORD in marketing/.env');
    process.exit(1);
  }

  const cliArgs = process.argv.slice(2);
  const headed = cliArgs.includes('--headed');

  // Each Chromium context uses ~250–350 MB. Cap at free RAM / 300 MB, but never
  // more than the country count or the logical CPU count.
  const freeRamMb = os.freemem() / 1024 / 1024;
  const byRam = Math.max(1, Math.floor(freeRamMb / 300));
  const byCpu = os.cpus().length;
  const defaultWorkers = Math.min(byRam, byCpu, MARKETING_COUNTRIES.length);
  const CONCURRENCY = Math.min(
    Math.max(1, Number(process.env.PLAYWRIGHT_WORKERS ?? defaultWorkers)),
    MARKETING_COUNTRIES.length,
  );
  console.log(`By RAM: ${byRam}`);
  console.log(`By CPU: ${byCpu}`);
  console.log(`Free RAM: ${freeRamMb} MB`);
  console.log(`Default workers: ${defaultWorkers}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  if (headed) {
    console.log('Browser: headed (--headed) — Chromium UI visible');
  }

  const browser = await chromium.launch({ headless: !headed, slowMo: 80 });

  // Phase 1: ensure a valid auth state file exists (sequential, one context)
  const authContext = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 900 },
    ...(existsSync(AUTH_STATE_FILE) ? { storageState: AUTH_STATE_FILE } : {}),
  });
  const authPage = await authContext.newPage();

  try {
    if (existsSync(AUTH_STATE_FILE)) {
      await authPage.goto(`${BASE_URL}/projects`);
      // cspell:ignore networkidle
      await authPage.waitForLoadState('networkidle', { timeout: 15_000 });
      // Give the SPA up to 3 s to finish its async auth check and fire a
      // client-side redirect to /login if the session is expired.
      const sessionExpired = await authPage
        .waitForURL((url) => url.pathname.startsWith('/login'), { timeout: 3_000 })
        .then(() => true)
        .catch(() => false);
      if (!sessionExpired) {
        console.log('✓ Resumed saved session (login skipped)');
      } else {
        console.log('  → Saved session expired — logging in fresh…');
        await login(authPage, authContext);
      }
    } else {
      await login(authPage, authContext);
    }
  } finally {
    await authContext.close();
  }

  // Phase 2: distribute countries across workers, all sharing the saved auth state
  console.log(
    `\n⚡ Running ${CONCURRENCY} parallel worker(s) for ${MARKETING_COUNTRIES.length} countries\n`,
  );

  // Round-robin distribution: worker 0 gets indices 0, N, 2N… worker 1 gets 1, N+1…
  const slices: MarketingCountry[][] = Array.from({ length: CONCURRENCY }, () => []);
  MARKETING_COUNTRIES.forEach((c, i) => slices[i % CONCURRENCY].push(c));

  try {
    const results = await Promise.all(slices.map((slice, id) => runWorker(id, slice, browser)));
    const failed = results.flat();
    if (failed.length > 0) {
      console.warn(
        `\n⚠️  ${failed.length} country(ies) failed after retries: ${failed.join(', ')}`,
      );
      process.exitCode = 1;
    } else {
      console.log('\n✅  All done — assets saved to marketing/assets/');
    }
  } catch (err) {
    console.error('\n✗  Script failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error('\n✗  Unhandled script error:', error);
  process.exit(1);
});
