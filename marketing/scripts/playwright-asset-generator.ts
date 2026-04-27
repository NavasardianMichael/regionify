import { chromium, type BrowserContext, type Page } from 'playwright';
import { config as loadEnv } from 'dotenv';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

loadEnv({ path: join(__dirname, '..', '.env') });

const BASE_URL = (process.env.CLIENT_URL ?? 'https://regionify.pro').replace(/\/$/, '');
const EMAIL = process.env.REGIONIFY_EMAIL ?? '';
const PASSWORD = process.env.REGIONIFY_PASSWORD ?? '';
const ASSETS_ROOT = join(__dirname, '..', 'assets');
// Persisted auth cookies — reused across runs to avoid hitting the login rate limiter.
const AUTH_STATE_FILE = join(ASSETS_ROOT, '.auth-state.json');

type Country = { slug: string; name: string };

// Add or remove countries here. All other code stays the same.
const COUNTRIES: Country[] = [
  { slug: 'armenia', name: 'Armenia' },
  { slug: 'russia', name: 'Russian Federation' },
  { slug: 'germany', name: 'Germany' },
  { slug: 'brazil', name: 'Brazil' },
  { slug: 'india', name: 'India' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    await closeBtn.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await page
    .locator('.ant-modal:visible')
    .waitFor({ state: 'hidden', timeout: 8_000 })
    .catch(() => {});
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

async function createProject(page: Page, country: Country): Promise<void> {
  await page.goto(`${BASE_URL}/projects/new`);
  // Wait for the region select to be available — reliable page-ready signal
  await page.locator('input[aria-label="Select a country"]').waitFor({ timeout: 15_000 });

  // Ant Design Select: aria-label is on the <input> inside the Select component.
  // Use keyboard.type (not fill) so the search filterOption fires properly.
  const regionInput = page.locator('input[aria-label="Select a country"]');
  await regionInput.click();
  await page.keyboard.type(country.name, { delay: 50 });
  // Wait for the dropdown portal to render filtered results
  await page.locator('.ant-select-dropdown:visible').waitFor({ timeout: 5_000 });
  // Click via Ant Design's option content class — reliable across portal renders
  await page
    .locator('.ant-select-dropdown:visible .ant-select-item-option-content', {
      hasText: country.name,
    })
    .first()
    .click();

  // Wait for SVG fetch + client-side sample data generation.
  // "Switch to static data" appears once dynamic timeline data is ready (Chronographer tier).
  await page.waitForLoadState('networkidle', { timeout: 15_000 });
  await page.getByRole('button', { name: 'Switch to static data' }).waitFor({ timeout: 15_000 });
  console.log(`  ✓ Country selected — sample data loaded`);

  // Save project
  await page.getByRole('button', { name: 'Save' }).click();
  await page.locator('.ant-modal').filter({ hasText: 'Save Project' }).waitFor({ timeout: 10_000 });
  await page.locator('.ant-modal input[type="text"]').fill(`${country.name} Marketing`);
  await page.getByRole('button', { name: 'Create' }).click();
  await page.waitForURL(`${BASE_URL}/projects/**`, { timeout: 15_000 });
  console.log(`  ✓ Project saved`);
}

// ---------------------------------------------------------------------------
// Export animated: GIF or MP4 (dynamic mode)
// ---------------------------------------------------------------------------

async function exportAnimated(
  page: Page,
  assetsDir: string,
  slug: string,
  format: 'GIF' | 'MP4',
): Promise<void> {
  // Option labels as rendered in the export type dropdown
  const optionLabel = format === 'GIF' ? 'GIF (Animation)' : 'Video (MP4)';
  const fileName = format === 'GIF' ? `${slug}-animation.gif` : `${slug}-video.mp4`;
  // Download button label: "Download GIF" for GIF, "Download Video" for MP4
  const downloadLabel = format === 'GIF' ? 'Download GIF' : 'Download Video';

  await page.getByRole('button', { name: 'Export' }).click();
  await page
    .locator('.ant-modal')
    .filter({ hasText: 'Configure Exporting Asset' })
    .waitFor({ timeout: 10_000 });

  await selectAntOption(page, 'visualizer.exportModal.exportTypeLabel', optionLabel);

  // GIF/MP4 require a crop step before the actual download
  await page.getByRole('button', { name: 'Next: Crop & Download' }).click();
  await page
    .locator('.ant-modal')
    .filter({ hasText: 'Crop & Download' })
    .waitFor({ timeout: 15_000 });

  const downloadBtn = page.getByRole('button', { name: downloadLabel });
  await downloadBtn.waitFor({ timeout: 30_000 });

  // Register download listener BEFORE clicking to avoid race condition
  const downloadPromise = page.waitForEvent('download', { timeout: 180_000 });
  await downloadBtn.click();
  const download = await downloadPromise;
  await download.saveAs(join(assetsDir, fileName));
  console.log(`  ✓ ${format} → ${fileName}`);

  await closeModal(page);
}

// ---------------------------------------------------------------------------
// Set map background to transparent (must be done before any export)
// ---------------------------------------------------------------------------

async function setTransparentBackground(page: Page): Promise<void> {
  // The Transparent switch lives in the Background collapse of the right styles panel.
  const transparentSwitch = page.getByRole('switch', { name: 'Transparent' });

  // Expand the Background collapse section if the switch isn't already visible
  if (!(await transparentSwitch.isVisible().catch(() => false))) {
    await page.locator('[data-i18n-key="visualizer.mapStyles.collapseBackground"]').first().click();
    await transparentSwitch.waitFor({ timeout: 5_000 });
  }

  await switchOn(transparentSwitch);
  console.log(`  ✓ Background set to transparent`);
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
// Switch visualizer to static data mode
// ---------------------------------------------------------------------------

async function switchToStaticMode(page: Page): Promise<void> {
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
  console.log(`  ✓ Switched to static mode`);
}

// ---------------------------------------------------------------------------
// Export SVG + PNG in one modal session (avoids React state reset on reopen)
// ---------------------------------------------------------------------------

async function exportStaticAssets(page: Page, assetsDir: string, slug: string): Promise<void> {
  // PNG first — first modal open in static mode has no crop step; direct download button available
  await page.getByRole('button', { name: 'Export' }).click();
  let modal = page.locator('.ant-modal').filter({ hasText: 'Configure Exporting Asset' });
  await modal.waitFor({ timeout: 10_000 });

  await selectAntOption(page, 'visualizer.exportModal.exportTypeLabel', 'PNG');
  // PNG goes through the same crop step as GIF/MP4: Next → Download PNG
  // After clicking Next, the modal title changes so we scope the download btn to the whole page
  await modal.getByRole('button', { name: 'Next: Crop & Download' }).click();
  const pngBtn = page.getByRole('button', { name: 'Download PNG' });
  await pngBtn.waitFor({ timeout: 30_000 });
  const pngDl = page.waitForEvent('download', { timeout: 60_000 });
  await pngBtn.click();
  await (await pngDl).saveAs(join(assetsDir, `${slug}-static.png`));
  console.log(`  ✓ PNG → ${slug}-static.png`);
  // Modal auto-closes after download; close manually if it didn't
  await closeModal(page).catch(() => {});

  // SVG: reopen export modal and select SVG
  await page.getByRole('button', { name: 'Export' }).click();
  modal = page.locator('.ant-modal').filter({ hasText: 'Configure Exporting Asset' });
  await modal.waitFor({ timeout: 10_000 });

  await selectAntOption(page, 'visualizer.exportModal.exportTypeLabel', 'SVG');
  const svgBtn = modal
    .locator('button')
    .filter({ hasText: /Download SVG/i })
    .first();
  await svgBtn.waitFor({ timeout: 30_000 });
  const svgDl = page.waitForEvent('download', { timeout: 60_000 });
  await svgBtn.click();
  await (await svgDl).saveAs(join(assetsDir, `${slug}.svg`));
  console.log(`  ✓ SVG → ${slug}.svg`);

  await closeModal(page);
}

// ---------------------------------------------------------------------------
// Enable public embed and return the full embed page URL
// ---------------------------------------------------------------------------

async function setupEmbed(page: Page, country: Country): Promise<string> {
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
  console.log(`  ✓ Embed saved`);

  // After save the embed URL appears as an <a href="..."> (AppNavLink → React Router NavLink)
  const embedLink = modal.locator('a[href*="/embed/"]');
  await embedLink.waitFor({ timeout: 10_000 });
  const href = (await embedLink.getAttribute('href')) ?? '';
  const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
  console.log(`  ✓ Embed URL: ${fullUrl}`);
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
): Promise<void> {
  const embedPage = await context.newPage();
  await embedPage.goto(embedUrl, { waitUntil: 'networkidle', timeout: 30_000 });
  // Give the map canvas extra time to finish painting
  await embedPage.waitForTimeout(4_000);
  await embedPage.screenshot({ path: join(assetsDir, `${slug}-embed-page.png`), fullPage: true });
  await embedPage.close();
  console.log(`  ✓ Embed page screenshot → ${slug}-embed-page.png`);
}

// ---------------------------------------------------------------------------
// Read iframe snippet from embed modal and save code + section screenshot
// ---------------------------------------------------------------------------

async function captureIframeCode(page: Page, assetsDir: string, slug: string): Promise<void> {
  const modal = page.locator('.ant-modal:visible').filter({ hasText: 'Public map embed' });

  // EmbedIframeCode renders the snippet inside <pre class="... font-mono ...">
  const iframePre = modal.locator('pre').filter({ hasText: '<iframe' });
  await iframePre.waitFor({ timeout: 10_000 });

  const iframeCode = (await iframePre.textContent()) ?? '';
  writeFileSync(join(assetsDir, `${slug}-iframe-code.html`), iframeCode.trim());
  console.log(`  ✓ Iframe code saved → ${slug}-iframe-code.html`);
}

// ---------------------------------------------------------------------------
// Per-country orchestrator
// ---------------------------------------------------------------------------

async function generateAssetsForCountry(
  page: Page,
  context: BrowserContext,
  country: Country,
): Promise<void> {
  const assetsDir = join(ASSETS_ROOT, country.slug);
  mkdirSync(assetsDir, { recursive: true });

  console.log(`\n▶  ${country.name}`);

  await createProject(page, country);

  // Transparent background must be set while right panel is open (MapStylesPanel lives there)
  await setTransparentBackground(page);

  // Collapse right panel → wider map area → better aspect ratio for all exported assets
  await closeRightPanel(page);

  // Dynamic mode (default after country select) → GIF and MP4
  await exportAnimated(page, assetsDir, country.slug, 'GIF');
  await exportAnimated(page, assetsDir, country.slug, 'MP4');

  await switchToStaticMode(page);

  await exportStaticAssets(page, assetsDir, country.slug);

  // Embed: enable, configure, screenshot public page, capture iframe code
  const embedUrl = await setupEmbed(page, country);
  // Save embed URL so the marketing site can render a live iframe
  writeFileSync(join(assetsDir, `${country.slug}-embed-url.txt`), embedUrl);
  await screenshotEmbedPage(context, embedUrl, assetsDir, country.slug);

  // Turn showHeader OFF after screenshotting the embed page (iframe embed shows clean map only)
  const embedModal = page.locator('.ant-modal:visible').filter({ hasText: 'Public map embed' });
  const showHeaderSwitch = embedModal.locator('button#showHeader[role="switch"]');
  await showHeaderSwitch.waitFor({ timeout: 5_000 });
  if ((await showHeaderSwitch.getAttribute('aria-checked')) === 'true') {
    await showHeaderSwitch.click();
    await embedModal.locator('[data-i18n-key="visualizer.save"]').click();
    await page
      .locator('.ant-message-notice', { hasText: 'Embed settings saved' })
      .waitFor({ timeout: 10_000 });
  }

  await captureIframeCode(page, assetsDir, country.slug);

  await closeModal(page);
  console.log(`✓  Done: ${country.name}`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  if (!EMAIL || !PASSWORD) {
    console.error('Set REGIONIFY_EMAIL and REGIONIFY_PASSWORD in marketing/.env');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const hasSavedState = existsSync(AUTH_STATE_FILE);
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 900 },
    ...(hasSavedState ? { storageState: AUTH_STATE_FILE } : {}),
  });
  const page = await context.newPage();

  try {
    if (hasSavedState) {
      // Verify the saved session is still valid by navigating to the app
      await page.goto(`${BASE_URL}/projects`);
      await page.waitForLoadState('networkidle', { timeout: 15_000 });
      const stillLoggedIn = !page.url().includes('/login');
      if (stillLoggedIn) {
        console.log('✓ Resumed saved session (login skipped)');
      } else {
        console.log('  → Saved session expired — logging in fresh…');
        await login(page, context);
      }
    } else {
      await login(page, context);
    }
    for (const country of COUNTRIES) {
      await generateAssetsForCountry(page, context, country);
    }
    console.log('\n✅  All done — assets saved to marketing/assets/');
  } catch (err) {
    console.error('\n✗  Script failed:', err);
    // Save a debug screenshot to help diagnose the failure
    await page.screenshot({ path: join(ASSETS_ROOT, '_error.png') }).catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
}

main().catch(() => process.exit(1));
