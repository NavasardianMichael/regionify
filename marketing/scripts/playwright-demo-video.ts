/**
 * Marketing demo video recorder — companion to playwright-marketing-screenshots.ts.
 *
 * Records a short workflow video for use in the LinkedIn post and (optionally) the
 * Medium article. The recording is a raw viewport capture — no zooms, no captions,
 * no music. If a marketing-polished result is needed, treat this as a rehearsal
 * take and re-record in a dedicated tool (Screen Studio, Descript, ScreenFlow).
 *
 * Storyboard (~60-80 s) — tutorial: generate data with AI and export as MP4.
 *   0-3s    land on /projects/new
 *   3-8s    pick "France" in the country picker
 *   8-13s   sample data loads
 *   13-17s  select "AI Agent" import mode
 *   17-21s  click "Parse with AI" → AI Agent modal opens
 *   21-25s  switch to the "Generator" tab inside the modal
 *   25-32s  type the prompt (average annual temperature per region × 10 years)
 *   32-36s  click "Generate with AI"
 *   36-??s  stream in — table view auto-appears when done (detected via the
 *           streaming textarea disappearing, not by polling the Save button)
 *   ??-??s  click "Save" — modal closes, dynamic map paints with the AI data
 *   ??-??s  expand the "Ranges" accordion in Legend Configuration → click "Normalize ranges"
 *   ??-??s  click Play on the timeline → animation runs through every year → Pause
 *   ??-??s  click Export → format = Video (MP4) → quality 40 → Download
 *   ??-end  MP4 renders on-camera, video ends after the download event fires
 *
 * This is a tutorial, not an export harvester. The final MP4 file the browser
 * receives is deleted immediately — the recording is the sole deliverable.
 *
 * Post-processed via ffmpeg: 2× for the whole video; AI streaming + MP4 render waits at 4×.
 * Without ffmpeg on PATH the raw 1× recording is kept.
 *
 * Output: `docs/marketing/assets/video/demo-video.webm`
 *
 * Run:
 *   pnpm --filter @regionify/marketing generate-demo-video
 *   pnpm --filter @regionify/marketing generate-demo-video -- --headed   # to watch
 *
 * Requires:
 *   marketing/.env with CLIENT_URL, REGIONIFY_EMAIL, REGIONIFY_PASSWORD set.
 *   Account must be on any paid tier.
 *   ffmpeg on PATH, or the `ffmpeg-static` npm devDependency (bundled binary).
 */

import { chromium, type BrowserContext, type Locator, type Page } from 'playwright';
import { config as loadEnv } from 'dotenv';
import ffmpegStaticPath from 'ffmpeg-static';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dirname, '..', '.env') });

const BASE_URL = (process.env.CLIENT_URL ?? '').replace(/\/$/, '');
const EMAIL = process.env.REGIONIFY_EMAIL ?? '';
const PASSWORD = process.env.REGIONIFY_PASSWORD ?? '';

/** API origin for session-scoped requests (profile locale patch). */
function resolveApiBaseUrl(clientUrl: string): string {
  const fromEnv = process.env.API_BASE_URL ?? process.env.VITE_API_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  // Local dev default: Vite client :7002 → Express API :9002.
  if (/localhost:7002$/i.test(clientUrl)) return 'http://localhost:9002';
  return clientUrl;
}

const API_BASE_URL = BASE_URL ? resolveApiBaseUrl(BASE_URL) : '';

const ASSETS_ROOT = join(__dirname, '..', 'assets');
const AUTH_STATE_FILE = join(ASSETS_ROOT, '.auth-state.json');
/** Playwright writes videos with random filenames — collect them in a scratch dir first. */
const VIDEO_TMP_DIR = join(ASSETS_ROOT, '.video-tmp');
const OUTPUT_DIR = join(__dirname, '..', '..', 'docs', 'marketing', 'assets', 'video');
const OUTPUT_FILE = 'demo-video.webm';

/**
 * Landscape, taller than standard 16:9 — the map panel is a `flex-1` block that
 * fills whatever space is left under the header/timeline, and it needs real
 * viewport height (not just zooming out) to render France's full outline
 * (down through Corsica) without the `overflow-hidden` wrapper clipping it.
 * Zooming out shrinks the available space and the map's required space by the
 * same factor, so it never changes what fraction gets clipped — only a taller
 * viewport does that.
 */
const VIDEO_SIZE = { width: 1280, height: 960 } as const;

/**
 * The dashboard's sidebars (Legend Configuration's lower controls, Map Styles'
 * "Reset Styles" row, etc.) are made of fixed-height controls, so rendering the
 * page at less than 100% CSS zoom gives them proportionally more headroom to
 * fit inside `VIDEO_SIZE` without being clipped at the fold.
 */
const PAGE_ZOOM = 0.85;

const DEMO_COUNTRY = { slug: 'france', name: 'France' } as const;

/**
 * Prompt fed to the AI Agent → Generator tab. The wording is deliberately
 * plain-English (no schema hints) so the demo shows off Regionify's natural-
 * language dataset generation.
 */
const AI_GENERATOR_PROMPT =
  'Generate average annual temperature in Celsius for each region of France from 2015 to 2024 ' +
  '(10 years). Return realistic values.';

/** Default playback speed for all segments (2× = half the real-time duration). */
const GLOBAL_SPEED_FACTOR = 2;

/** Extra speed for AI streaming and MP4 render wait segments (4× vs real-time). */
const WAIT_SEGMENT_SPEED_FACTOR = 4;

// ---------------------------------------------------------------------------
// Speed-range marks (post-processed with ffmpeg after recording)
// ---------------------------------------------------------------------------

type SpeedRange = { startMs: number; endMs: number; factor: number };

const speedRanges: SpeedRange[] = [];
/** Wall-clock timestamp when the recorded page opens — video t=0 for trim boundaries. */
let pageOpenAt = 0;

function markSpeedRangeStart(): number {
  return Date.now() - pageOpenAt;
}

function commitSpeedRange(startMs: number, factor: number): void {
  const endMs = Date.now() - pageOpenAt;
  if (endMs <= startMs || factor <= 1) return;
  speedRanges.push({ startMs, endMs, factor });
  log(
    `⏩ speed range ${(startMs / 1_000).toFixed(1)}s – ${(endMs / 1_000).toFixed(1)}s @ ${factor}×`,
  );
}

// ---------------------------------------------------------------------------
// Visible cursor + click-target highlight overlays
// ---------------------------------------------------------------------------

/**
 * Playwright doesn't render the mouse cursor in its video recordings, and it
 * has no first-party API for highlighting click targets. Both problems are
 * solved by the same trick: inject DOM overlays via `addInitScript`.
 *
 * This script installs:
 *   1. A cursor sprite that follows real mouse events (Playwright dispatches
 *      native events, so mousemove/mousedown listeners fire correctly).
 *   2. A highlight-ring API on `window`:
 *        window.__marketingHighlight({ top, left, width, height })
 *        window.__marketingHighlightClear()
 *      Callable from Playwright via `page.evaluate(...)` to draw a ring around
 *      the next click target BEFORE the click happens — so viewers see what's
 *      about to be interacted with.
 */
/** Applied once per document via `addInitScript` — see the `PAGE_ZOOM` comment. */
const PAGE_ZOOM_INIT_SCRIPT = `
  (() => {
    document.documentElement.style.zoom = '${PAGE_ZOOM}';
  })();
`;

/** Force English UI for marketing recordings (logged-in locale overrides localStorage). */
const LOCALE_EN_INIT_SCRIPT = `
  (() => {
    try { localStorage.setItem('regionify-locale', 'en'); } catch {}
  })();
`;

const OVERLAY_INIT_SCRIPT = `
  (() => {
    if (window.__marketingOverlaysInjected) return;
    window.__marketingOverlaysInjected = true;

    const install = () => {
      if (document.getElementById('__marketing_cursor__')) return;

      const style = document.createElement('style');
      style.textContent = \`
        #__marketing_cursor__ {
          position: fixed;
          top: 0;
          left: 0;
          width: 22px;
          height: 22px;
          margin-left: -2px;
          margin-top: -2px;
          pointer-events: none;
          z-index: 2147483647;
          transform: translate3d(-100px, -100px, 0);
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M5 3 L5 19 L9.5 14.5 L12.5 21 L15 20 L12 13.5 L18 13 Z' fill='%23111827' stroke='%23ffffff' stroke-width='1.4' stroke-linejoin='round'/></svg>");
          background-size: 22px 22px;
          background-repeat: no-repeat;
          transition: transform 40ms linear;
        }
        #__marketing_cursor__.click::after {
          content: '';
          position: absolute;
          top: 4px;
          left: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(24, 41, 77, 0.45);
          animation: __cursorClick 500ms ease-out forwards;
        }
        @keyframes __cursorClick {
          from { transform: scale(0.3); opacity: 1; }
          to   { transform: scale(2.2); opacity: 0; }
        }
        #__marketing_highlight__ {
          position: fixed;
          pointer-events: none;
          z-index: 2147483646;
          border: 4px solid #ef4444;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.12);
          box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.35), 0 0 32px rgba(239, 68, 68, 0.75);
          opacity: 0;
          transform: scale(1.18);
          transition: opacity 180ms ease-out, transform 220ms ease-out;
        }
        #__marketing_highlight__.visible {
          opacity: 1;
          transform: scale(1);
        }
      \`;
      document.head.appendChild(style);

      // ------- Cursor sprite -------
      const cursor = document.createElement('div');
      cursor.id = '__marketing_cursor__';
      document.body.appendChild(cursor);

      document.addEventListener('mousemove', (e) => {
        cursor.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
      }, true);
      document.addEventListener('mousedown', () => {
        cursor.classList.remove('click');
        // Force reflow so the animation restarts on repeat clicks
        void cursor.offsetWidth;
        cursor.classList.add('click');
      }, true);

      // ------- Click-target highlight ring -------
      // Small padding — the ring hugs the target so the exact click point is unambiguous.
      const PADDING = 2;

      window.__marketingHighlight = (rect) => {
        window.__marketingHighlightClear();
        const el = document.createElement('div');
        el.id = '__marketing_highlight__';
        el.style.top = (rect.top - PADDING) + 'px';
        el.style.left = (rect.left - PADDING) + 'px';
        el.style.width = (rect.width + PADDING * 2) + 'px';
        el.style.height = (rect.height + PADDING * 2) + 'px';
        document.body.appendChild(el);
        // Force reflow, then trigger fade-in transition
        void el.offsetWidth;
        el.classList.add('visible');
      };

      window.__marketingHighlightClear = () => {
        const existing = document.getElementById('__marketing_highlight__');
        if (!existing) return;
        existing.classList.remove('visible');
        setTimeout(() => existing.remove(), 220);
      };
    };

    if (document.body) install();
    else document.addEventListener('DOMContentLoaded', install, { once: true });
  })();
`;

// ---------------------------------------------------------------------------
// Helpers — trimmed subset of playwright-marketing-screenshots.ts
// ---------------------------------------------------------------------------

function log(msg: string): void {
  console.log(`[video] ${msg}`);
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

/**
 * Ensure auth state exists and is valid. Uses a non-recorded context so the
 * login flow doesn't end up in the demo video.
 */
async function ensureAuthState(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
): Promise<void> {
  const context = await browser.newContext({
    viewport: VIDEO_SIZE,
    ...(existsSync(AUTH_STATE_FILE) ? { storageState: AUTH_STATE_FILE } : {}),
  });
  const page = await context.newPage();

  try {
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
  } finally {
    await context.close();
  }
}

/** Patch the logged-in user's profile locale so button labels match English selectors. */
async function ensureEnglishProfile(context: BrowserContext): Promise<void> {
  if (!API_BASE_URL) return;
  try {
    const res = await context.request.patch(`${API_BASE_URL}/auth/profile`, {
      data: { locale: 'en' },
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok()) {
      log('✓ profile locale set to English');
    } else {
      log(`⚠ profile locale patch failed (${res.status()}) — UI may not be English`);
    }
  } catch (err) {
    log(`⚠ could not patch profile locale: ${err instanceof Error ? err.message : err}`);
  }
}

async function waitForVisualizerReady(page: Page, timeoutMs = 30_000): Promise<void> {
  await page
    .locator('[data-i18n-key="visualizer.embed.openButton"]')
    .waitFor({ state: 'visible', timeout: timeoutMs });
}

/**
 * Draw a highlight ring around `locator`'s bounding box, wait `dwellMs`, then
 * click. The ring fades out ~220 ms after the click via `__marketingHighlightClear`.
 *
 * The sequence for viewers is:
 *   1. cursor moves to target (Playwright's implicit mouse-move)
 *   2. amber ring fades in around the target
 *   3. short dwell so the viewer registers what's about to be clicked
 *   4. click fires (cursor sprite's click-ripple animates)
 *   5. ring fades out
 */
async function clickWithHighlight(
  page: Page,
  locator: Locator,
  opts: { dwellMs?: number; force?: boolean } = {},
): Promise<void> {
  const { dwellMs = 500, force = false } = opts;

  await locator.waitFor({ state: 'visible', timeout: 15_000 });
  // Nudge the cursor onto the target so the ring appears where the cursor is,
  // not at some off-screen phantom location.
  await locator.hover({ force }).catch(() => {
    /* hover isn't essential — proceed even if it fails on tricky elements */
  });

  const box = await locator.boundingBox();
  if (box) {
    // Playwright's boundingBox() returns { x, y, width, height }; the injected
    // helper positions a `position: fixed` overlay via CSS top/left. Map the
    // coordinate names explicitly so an undefined `rect.top` doesn't yield
    // `NaNpx` and drop the ring to the bottom of the flow.
    type HighlightRect = { top: number; left: number; width: number; height: number };
    const rect: HighlightRect = {
      top: box.y,
      left: box.x,
      width: box.width,
      height: box.height,
    };
    await page.evaluate(
      (r: HighlightRect) =>
        (
          window as unknown as { __marketingHighlight?: (rect: HighlightRect) => void }
        ).__marketingHighlight?.(r),
      rect,
    );
    await page.waitForTimeout(dwellMs);
  }

  await locator.click({ force });

  // Let the click-ripple play, then clear the ring.
  await page.waitForTimeout(220);
  await page.evaluate(() => {
    (window as unknown as { __marketingHighlightClear?: () => void }).__marketingHighlightClear?.();
  });
}

async function expandRightPanelIfCollapsed(page: Page): Promise<void> {
  const separator = page.locator('.ant-splitter-bar').last();
  const exists = await separator.isVisible({ timeout: 2_000 }).catch(() => false);
  if (!exists) return;
  const valueNow = Number(await separator.getAttribute('aria-valuenow'));
  const valueMax = Number(await separator.getAttribute('aria-valuemax'));
  if (Number.isNaN(valueNow) || Number.isNaN(valueMax) || valueNow <= valueMax) return;
  const expandBtn = page.locator('.ant-splitter-bar-collapse-bar-start').last();
  if (await expandBtn.isVisible({ timeout: 1_500 }).catch(() => false)) {
    await expandBtn.click({ force: true });
    await page.waitForTimeout(500);
  }
}

/** Locator for the Ant Design Select whose adjacent label has `data-i18n-key={i18nKey}`. */
function antSelectByLabelKey(scope: Locator | Page, i18nKey: string): Locator {
  return scope
    .locator(`[data-i18n-key="${i18nKey}"]`)
    .locator('..')
    .locator('..')
    .locator('.ant-select')
    .first();
}

/** Locator for the Export configure modal (step 1). Locale-independent (uses i18n key). */
function exportConfigureModal(page: Page): Locator {
  return page
    .locator('.ant-modal:visible')
    .filter({ has: page.locator('[data-i18n-key="visualizer.exportModal.title"]') });
}

/** Primary "Download" button (skips "Next" — different icon). */
function exportPrimaryDownloadButton(modal: Locator): Locator {
  return modal
    .locator('button.ant-btn-primary')
    .filter({ has: modal.page().locator('.anticon-download') })
    .first();
}

/** Set an Ant Design InputNumber value by locating it via its adjacent label's data-i18n-key. */
async function setInputNumberByLabelKey(page: Page, i18nKey: string, value: number): Promise<void> {
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

// ---------------------------------------------------------------------------
// The recorded storyboard
// ---------------------------------------------------------------------------

async function recordStoryboard(page: Page): Promise<void> {
  // 0-3s — land on the new-project page.
  await page.goto(`${BASE_URL}/projects/new`);
  await page.waitForLoadState('networkidle', { timeout: 15_000 });
  await waitForVisualizerReady(page);
  await page.waitForTimeout(1_500);

  // 3-8s — pick the demo country from the country dropdown.
  const regionSelect = antSelectByLabelKey(page, 'visualizer.region.sectionTitle');
  await clickWithHighlight(page, regionSelect, { dwellMs: 450 });
  await page.waitForTimeout(400);
  await page.keyboard.type(DEMO_COUNTRY.name, { delay: 80 });
  await page.waitForTimeout(500);

  // Prefer stable region id over localized label text (works in any UI locale).
  const countryOptionByValue = page.locator(
    `.ant-select-dropdown:visible .ant-select-item-option[data-value="${DEMO_COUNTRY.slug}"]`,
  );
  let countryOption: Locator;
  if ((await countryOptionByValue.count()) > 0) {
    countryOption = countryOptionByValue;
  } else {
    countryOption = page
      .locator('.ant-select-dropdown:visible .ant-select-item-option-content')
      .filter({ hasText: new RegExp(`^${DEMO_COUNTRY.name}$`) });
  }
  await clickWithHighlight(page, countryOption, { dwellMs: 400 });

  // 8-13s — sample data loads. Wait for the mode-toggle button as "app is ready".
  await page.waitForLoadState('networkidle', { timeout: 20_000 });
  await page
    .getByRole('button', { name: /Switch to (dynamic|static) data/ })
    .waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2_000);

  // 13-17s — switch import mode to "AI Agent" (radio value=ai_parser).
  const aiAgentRadio = page.locator('input[type="radio"][value="ai_parser"]');
  await aiAgentRadio.waitFor({ timeout: 10_000 });
  // Radios in Ant Design put a large hit target on the wrapping label — highlight
  // the visible label so the ring reads correctly, then check the input.
  const aiAgentLabel = page.locator('label.ant-radio-wrapper', { has: aiAgentRadio }).first();
  await clickWithHighlight(page, aiAgentLabel, { dwellMs: 450 });

  // 17-21s — click the primary "Parse with AI" button that opens the AI Agent modal.
  const openAiAgentBtn = page.locator('[data-i18n-key="visualizer.aiParserModal.submit"]');
  await openAiAgentBtn.waitFor({ timeout: 10_000 });
  await clickWithHighlight(page, openAiAgentBtn, { dwellMs: 500 });

  // Modal identified by its `.ant-modal-title` element (locale-dependent but stable).
  const aiModal = page
    .locator('.ant-modal:visible')
    .filter({ has: page.locator('.ant-modal-title', { hasText: 'AI Agent' }) });
  await aiModal.waitFor({ timeout: 15_000 });
  await page.waitForTimeout(1_000);

  // 21-25s — switch to the "Generator" tab.
  const generatorTab = aiModal.getByRole('tab', { name: 'Generator' });
  await clickWithHighlight(page, generatorTab, { dwellMs: 500 });
  await page.waitForTimeout(800);

  // 25-32s — focus the prompt textarea and type the natural-language prompt.
  // Both tabs render a textarea; the Parser one stays mounted-but-hidden after we
  // switch to Generator, so scope to the active tab pane to avoid clicking the
  // hidden one.
  const promptTextarea = aiModal.locator('.ant-tabs-tabpane-active textarea').first();
  await clickWithHighlight(page, promptTextarea, { dwellMs: 400 });
  await page.keyboard.type(AI_GENERATOR_PROMPT, { delay: 22 });
  await page.waitForTimeout(600);

  // 32-36s — click "Generate with AI". The modal streams the response — during
  // streaming the button label flips to "Generating…" and the textarea reflects
  // live tokens. When done the modal auto-switches to table view.
  const generateBtn = aiModal.getByRole('button', { name: 'Generate with AI' });
  await clickWithHighlight(page, generateBtn, { dwellMs: 500 });

  log('⏳ AI is generating dataset — can take 15-45s');
  const aiWaitStart = markSpeedRangeStart();
  await promptTextarea.waitFor({ state: 'hidden', timeout: 120_000 });
  const generatedTable = aiModal.locator('.ant-table').first();
  await generatedTable.waitFor({ state: 'visible', timeout: 15_000 });
  commitSpeedRange(aiWaitStart, WAIT_SEGMENT_SPEED_FACTOR);
  await page.waitForTimeout(800);

  const saveBtn = aiModal.getByRole('button', { name: 'Save' });

  // Click Save — modal closes, data commits, map re-renders in dynamic mode
  // (the prompt asked for 10 years so timeline data will kick in automatically).
  await clickWithHighlight(page, saveBtn, { dwellMs: 500 });
  await aiModal.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});

  // Data commits, timeline slider appears — hold a beat so the viewer sees the
  // freshly-populated animated map.
  await page
    .locator('.ant-slider')
    .waitFor({ state: 'visible', timeout: 15_000 })
    .catch(() => {});
  await page.waitForTimeout(3_500);

  // ── Legend Configuration → normalize ranges to the freshly generated data ──
  const rangesAccordionHeader = page
    .locator('.ant-collapse-header')
    .filter({ has: page.locator('[data-i18n-key="visualizer.legendConfig.collapseRanges"]') });
  await clickWithHighlight(page, rangesAccordionHeader, { dwellMs: 450 });

  const normalizeRangesBtn = page.locator(
    '[data-i18n-key="visualizer.legendConfig.normalizeRangesAria"]',
  );
  await clickWithHighlight(page, normalizeRangesBtn, { dwellMs: 500 });
  await page.waitForTimeout(1_500);

  // ── Play the timeline animation through all years before exporting ──
  const playBtn = page.getByRole('button', { name: 'Play animation' });
  const playBtnAppeared = await playBtn
    .waitFor({ timeout: 10_000 })
    .then(() => true)
    .catch(() => false);

  if (playBtnAppeared) {
    // Read the period count off the slider's own aria attributes so the wait scales
    // with however many years the AI actually generated, instead of hardcoding 10.
    const sliderHandle = page.locator('.ant-slider [role="slider"]').first();
    const maxAttr = await sliderHandle.getAttribute('aria-valuemax').catch(() => null);
    const periodCount = maxAttr !== null ? Number(maxAttr) + 1 : 10;

    await clickWithHighlight(page, playBtn, { dwellMs: 450 });

    // Default playback is 1s/period (AnimationControls.tsx) — wait one full loop
    // through every period, plus a buffer for the smooth blend transition and a
    // beat to land on the final frame before pausing.
    const fullLoopMs = periodCount * 1_300 + 1_000;
    await page.waitForTimeout(fullLoopMs);

    const pauseBtn = page.getByRole('button', { name: 'Pause animation' });
    if (await pauseBtn.isVisible().catch(() => false)) {
      await clickWithHighlight(page, pauseBtn, { dwellMs: 400 });
    }
  }

  // ── Export as MP4 ──
  const exportBtn = page.getByRole('button', { name: 'Export' });
  await clickWithHighlight(page, exportBtn, { dwellMs: 450 });

  const configureModal = exportConfigureModal(page);
  await configureModal.waitFor({ timeout: 10_000 });
  await page.waitForTimeout(1_000);

  // Change format to Video (MP4).
  const formatSelect = antSelectByLabelKey(
    configureModal,
    'visualizer.exportModal.exportTypeLabel',
  );
  await clickWithHighlight(page, formatSelect, { dwellMs: 450 });

  const mp4Option = page
    .locator('.ant-select-dropdown:visible .ant-select-item-option-content', {
      hasText: 'Video (MP4)',
    })
    .first();
  await clickWithHighlight(page, mp4Option, { dwellMs: 400 });
  await page.waitForTimeout(1_000);

  // Quality → 40 (faster render, still crisp for social feeds).
  await setInputNumberByLabelKey(page, 'visualizer.exportModal.qualityLabel', 40);
  await page.waitForTimeout(800);

  // 38s-end — click Download. Rather than a fixed timeout (which cut the last take
  // off mid-progress at 79%), wait for the actual `download` event so the video
  // always ends *after* the render finishes. A generous safety timeout means if
  // the render ever stalls, we don't hang forever — we still end on a clean beat.
  const downloadBtn = exportPrimaryDownloadButton(configureModal);
  await downloadBtn.waitFor({ timeout: 30_000 });

  const downloadPromise = page.waitForEvent('download', { timeout: 60_000 });
  await clickWithHighlight(page, downloadBtn, { dwellMs: 500 });

  const downloadWaitStart = markSpeedRangeStart();
  try {
    const download = await downloadPromise;
    log('✓ MP4 render completed on-camera');
    await download.delete().catch(() => {});
  } catch {
    log('⚠ MP4 render did not finish within 60s — video will end on the progress state');
  }
  commitSpeedRange(downloadWaitStart, WAIT_SEGMENT_SPEED_FACTOR);

  // Small hold after completion so the viewer registers the "done" state
  // (progress bar hits 100 %, success toast appears) before the recording cuts.
  await page.waitForTimeout(2_500);
}

// ---------------------------------------------------------------------------
// ffmpeg post-processing — apply speed ranges captured during recording
// ---------------------------------------------------------------------------

function resolveFfmpegBinary(): string | null {
  try {
    const r = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    if (r.status === 0) return 'ffmpeg';
  } catch {
    // System ffmpeg not on PATH — try bundled binary below.
  }
  if (typeof ffmpegStaticPath === 'string' && existsSync(ffmpegStaticPath)) {
    return ffmpegStaticPath;
  }
  return null;
}

function runFfmpeg(ffmpegBin: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegBin, args, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code}`)),
    );
  });
}

function buildSpeedFilter(
  ranges: SpeedRange[],
  baseFactor: number,
): { filter: string; segmentCount: number } {
  const sorted = [...ranges]
    .filter((r) => r.endMs > r.startMs && r.factor > 1)
    .sort((a, b) => a.startMs - b.startMs);

  /** Collect segment specs first so we know how many split outputs we need. */
  type SegmentSpec = { startMs: number; endMs: number | null; factor: number };
  const segments: SegmentSpec[] = [];
  let cursorMs = 0;

  for (const r of sorted) {
    if (r.startMs < cursorMs) continue;
    if (r.startMs > cursorMs)
      segments.push({ startMs: cursorMs, endMs: r.startMs, factor: baseFactor });
    segments.push({ startMs: r.startMs, endMs: r.endMs, factor: r.factor });
    cursorMs = r.endMs;
  }
  segments.push({ startMs: cursorMs, endMs: null, factor: baseFactor });

  const parts: string[] = [];
  const labels: string[] = [];

  // Each trim branch needs its own copy of the input — [0:v] cannot be reused without split.
  const splitOuts = segments.map((_, i) => `[vs${i}]`).join('');
  parts.push(`[0:v]split=${segments.length}${splitOuts}`);

  segments.forEach((seg, i) => {
    const label = `s${i}`;
    const startSec = (seg.startMs / 1_000).toFixed(3);
    const trim =
      seg.endMs !== null
        ? `trim=start=${startSec}:end=${(seg.endMs / 1_000).toFixed(3)}`
        : `trim=start=${startSec}`;
    const pts = seg.factor === 1 ? 'setpts=PTS-STARTPTS' : `setpts=(PTS-STARTPTS)/${seg.factor}`;
    parts.push(`[vs${i}]${trim},${pts}[${label}]`);
    labels.push(`[${label}]`);
  });

  const concat = `${labels.join('')}concat=n=${labels.length}:v=1:a=0[v]`;
  return { filter: `${parts.join(';')};${concat}`, segmentCount: labels.length };
}

function encodeOutputArgs(outputPath: string): string[] {
  return [
    '-c:v',
    'libvpx-vp9',
    '-b:v',
    '0',
    '-crf',
    '32',
    '-deadline',
    'good',
    '-cpu-used',
    '4',
    '-an',
    outputPath,
  ];
}

async function postProcessSpeedRanges(
  rawPath: string,
  finalPath: string,
  ranges: SpeedRange[],
): Promise<void> {
  const needsProcessing = GLOBAL_SPEED_FACTOR > 1 || ranges.length > 0;
  if (!needsProcessing) {
    renameSync(rawPath, finalPath);
    return;
  }

  const ffmpegBin = resolveFfmpegBinary();
  if (!ffmpegBin) {
    log('⚠ ffmpeg not found — writing raw recording without speed-ups.');
    log('   Restart your terminal after installing ffmpeg, or run:');
    log('   node node_modules/ffmpeg-static/install.js');
    renameSync(rawPath, finalPath);
    return;
  }
  if (ffmpegBin !== 'ffmpeg') {
    log(`▶ using bundled ffmpeg (${ffmpegBin})`);
  }

  const tmpOut = `${rawPath}.processed.webm`;

  if (ranges.length === 0) {
    log(`▶ ffmpeg global ${GLOBAL_SPEED_FACTOR}× speed-up`);
    await runFfmpeg(ffmpegBin, [
      '-y',
      '-i',
      rawPath,
      '-vf',
      `setpts=PTS/${GLOBAL_SPEED_FACTOR}`,
      ...encodeOutputArgs(tmpOut),
    ]);
  } else {
    const { filter, segmentCount } = buildSpeedFilter(ranges, GLOBAL_SPEED_FACTOR);
    log(
      `▶ ffmpeg ${GLOBAL_SPEED_FACTOR}× base + ${ranges.length} wait range(s) @ ${WAIT_SEGMENT_SPEED_FACTOR}× (${segmentCount} segments)`,
    );
    await runFfmpeg(ffmpegBin, [
      '-y',
      '-i',
      rawPath,
      '-filter_complex',
      filter,
      '-map',
      '[v]',
      ...encodeOutputArgs(tmpOut),
    ]);
  }

  rmSync(rawPath, { force: true });
  renameSync(tmpOut, finalPath);
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

  const cliArgs = process.argv.slice(2);
  const headed = cliArgs.includes('--headed');

  mkdirSync(OUTPUT_DIR, { recursive: true });
  // Start with a clean scratch dir so we don't grab an old recording.
  if (existsSync(VIDEO_TMP_DIR)) rmSync(VIDEO_TMP_DIR, { recursive: true, force: true });
  mkdirSync(VIDEO_TMP_DIR, { recursive: true });

  // `slowMo` slows every Playwright action; makes on-screen motion look intentional.
  const browser = await chromium.launch({ headless: !headed, slowMo: 120 });

  // Phase 1 — ensure a valid session in a NON-recorded context.
  await ensureAuthState(browser);

  // Phase 2 — the recorded context. This is what ends up in the video.
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: VIDEO_SIZE,
    storageState: AUTH_STATE_FILE,
    recordVideo: {
      dir: VIDEO_TMP_DIR,
      size: VIDEO_SIZE,
    },
  });

  // Zoom out slightly so sidebar content isn't clipped at the fold, then inject
  // cursor + click-target-highlight overlays — both apply on every page load.
  await context.addInitScript(PAGE_ZOOM_INIT_SCRIPT);
  await context.addInitScript(OVERLAY_INIT_SCRIPT);
  await context.addInitScript(LOCALE_EN_INIT_SCRIPT);
  await ensureEnglishProfile(context);

  const page = await context.newPage();
  pageOpenAt = Date.now();

  try {
    log('▶ recording storyboard');
    await recordStoryboard(page);
    log('✓ storyboard finished — closing context to flush video');
  } finally {
    // Closing the context (not just the page) is what finalises the video file.
    await context.close();
    await browser.close();
  }

  // Playwright writes videos with an auto-generated filename; move the newest
  // .webm from the scratch dir to the final location.
  const webms = readdirSync(VIDEO_TMP_DIR).filter((f) => f.endsWith('.webm'));
  if (webms.length === 0) {
    console.error(`No .webm recording found in ${VIDEO_TMP_DIR}`);
    process.exit(1);
  }
  // If for some reason there are multiple, take the freshest.
  webms.sort();
  const rawPath = join(VIDEO_TMP_DIR, webms[webms.length - 1]);
  const dest = join(OUTPUT_DIR, OUTPUT_FILE);
  if (existsSync(dest)) rmSync(dest);

  await postProcessSpeedRanges(rawPath, dest, speedRanges);
  rmSync(VIDEO_TMP_DIR, { recursive: true, force: true });

  console.log(`\n✅  Demo video saved: ${dest}`);
  console.log('    To convert to MP4 (LinkedIn friendlier), if you have ffmpeg installed:');
  console.log(
    `    ffmpeg -i "${dest}" -c:v libx264 -pix_fmt yuv420p -crf 22 "${dest.replace(/\.webm$/, '.mp4')}"`,
  );
}

main().catch((err: unknown) => {
  console.error('\n✗  Unhandled script error:', err);
  process.exit(1);
});
