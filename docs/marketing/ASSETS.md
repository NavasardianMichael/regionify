# Marketing Assets — Generation Guide

Where the screenshots, images, and videos referenced in the LinkedIn post and Medium article come from, and how to (re)generate them.

## Two asset sources, one job each

The repo has two separate marketing asset pipelines. Which one you touch depends on what you need:

| Source folder                                 | Purpose                                                                                                                                                   | Regenerate with                       |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `docs/marketing/assets/images/*.png`          | Screenshots shown inline in the LinkedIn post / Medium article                                                                                            | `pnpm generate-marketing-screenshots` |
| `docs/marketing/assets/video/demo-video.webm` | Demo clip used in the LinkedIn post + Medium article                                                                                                      | `pnpm generate-demo-video`            |
| `docs/marketing/assets/audio/`                | Background music tracks (manual; not generated)                                                                                                           | —                                     |
| `marketing/assets/{country}/`                 | Country-specific output previews (PNG/GIF/MP4/SVG/embed page) consumed by the Astro marketing website AND cited as source material by the marketing posts | `pnpm generate-marketing-assets`      |

**Why two folders?** `docs/marketing/` holds documentation and copy for social-media posts. `marketing/` is the Astro landing-page website. Each has its own asset story:

- The Astro site needs a rich pool of per-country previews (Spain map, France embed, Germany GIF, …) — many countries, many outputs each.
- The social-media posts need a small set of UI-visible screenshots that show off the app's actual interface — one country as demo, one shot per feature.

They rarely overlap. When the LinkedIn/Medium post cites `marketing/assets/spain/spain-embed-page.png` as source material for the hero composite, it's borrowing from the website's asset pool as a matter of convenience — not building a dependency.

## `docs/marketing/assets/` — social-media deliverables

```
docs/marketing/assets/
├── audio/          # background music (manual)
├── images/         # PNG screenshots (generate-marketing-screenshots)
├── scripts/        # ffmpeg one-liners (e.g. mux audio onto demo video)
└── video/          # demo-video.webm + edited MP4 exports (generate-demo-video)
```

### Images (`images/`)

These are the four screenshots directly embedded in the article/post:

| File                    | What it is                                                     | Referenced by                             |
| ----------------------- | -------------------------------------------------------------- | ----------------------------------------- |
| `map-picker.png`        | `/projects/new` with the country dropdown open                 | Medium: Asset 3                           |
| `product-overview.png`  | Full app with data + styles sidebars visible                   | Medium: Asset 2 · LinkedIn: hero fallback |
| `data-import-panel.png` | Manual-entry modal with a deliberately messy Spain CSV pasted  | Medium: Asset 4 · LinkedIn: hero top half |
| `styling-panel.png`     | Right styles panel expanded, palette + legend controls visible | Medium: Asset 5                           |

## `marketing/assets/{country}/` — website + composite source material

`marketing/assets/{country}/` contains a full asset pack for ~180 countries, produced by the country-batch generator (`marketing/scripts/playwright-asset-generator.ts`).

Per country, you'll find:

| File                       | What it is                                          |
| -------------------------- | --------------------------------------------------- |
| `{country}-static.png`     | Styled choropleth PNG (transparent bg, watermarked) |
| `{country}.svg`            | SVG export of the same map                          |
| `{country}-animation.gif`  | Time-series animation (dynamic mode)                |
| `{country}-video.mp4`      | Same animation as MP4                               |
| `{country}-embed-page.png` | Public embed page screenshot (full page)            |
| `{country}-embed-url.txt`  | Live embed URL for that country                     |

Use these as-is wherever the article/post calls for a "finished map" visual. Recommended demo countries with strong visual identity:

- **Spain** — autonomous communities are large and colour-distinct
- **France** — régions with recognisable names
- **Germany** — Länder, familiar to European readers
- **Armenia** — small country, works well as an animated GIF in-flow

## Run instructions

### One-time setup

1. Copy `marketing/.env.example` → `marketing/.env` if you haven't already.
2. Set these vars in `marketing/.env`:
   - `CLIENT_URL` — the Regionify origin (`https://regionify.pro` for prod, `http://localhost:7002` for local dev)
   - `REGIONIFY_EMAIL` — an account on any paid tier
   - `REGIONIFY_PASSWORD` — its password
3. If targeting local dev: bring the app up first (`docker compose up -d && pnpm dev`).

### Regenerate the four social-media screenshots

From the repo root:

```
pnpm generate-marketing-screenshots
```

Or filter to a subset (note the quotes — PowerShell splits unquoted commas):

```
pnpm generate-marketing-screenshots -- '--only=map-picker,product-overview'
```

Run headed to watch it work (useful while iterating on selectors):

```
pnpm generate-marketing-screenshots -- '--headed'
```

Outputs overwrite anything in `docs/marketing/assets/images/`.

The script:

- Reuses the persisted auth session from `marketing/assets/.auth-state.json` when possible
- Falls back to a fresh login if the saved session has expired
- Creates or reuses a "Spain" demo project (same behaviour as the country-batch generator)
- Runs each capture routine sequentially; a single failure doesn't stop the others

### Regenerate the country-specific asset packs

From the repo root:

```
pnpm generate-marketing-assets
```

This runs against every country listed in `marketing/scripts/countries.ts` (currently ~230). It's the slow one — expect 20-40 minutes on a full run — but it's idempotent: existing files are skipped, so re-runs after failures only regenerate what's missing.

## Composite / hero image

Not generated by any script — assemble in Figma or Canva from:

- The **top half**: crop `docs/marketing/assets/images/data-import-panel.png` to the modal region (shows the messy CSV)
- The **bottom half**: crop `marketing/assets/spain/spain-embed-page.png` (or france/germany) to the map region

Portrait 4:5 (1200 × 1500) for LinkedIn, 2:1 (1500 × 750) for Medium hero.

## Demo video (`video/demo-video.webm`)

Auto-generated by `pnpm generate-demo-video`. Saved under `docs/marketing/assets/video/`. No audio by default — add a track from `audio/` and export to `video/demo-video-with-music.mp4` when posting.

**Storyboard** (scripted in `marketing/scripts/playwright-demo-video.ts`):

| Timestamp   | Action                                             |
| ----------- | -------------------------------------------------- |
| 0:00 – 0:03 | Land on `/projects/new`                            |
| 0:03 – 0:09 | Type "Spain" in country picker, click Spain option |
| 0:09 – 0:14 | Sample data loads, styled map paints               |
| 0:14 – 0:18 | Click "Apply Random Palette" — first palette swap  |
| 0:18 – 0:22 | Click "Apply Random Palette" — second palette swap |
| 0:22 – 0:27 | Click Export button, export modal opens            |
| 0:27 – 0:30 | Close modal, hold on final styled map              |

**Two quality-boosters baked into the script:**

1. `slowMo: 120` on the browser — every Playwright action runs a beat slower so motion looks intentional rather than machine-fast.
2. A custom cursor overlay injected via `page.addInitScript` — makes the mouse visible in the recording (Playwright doesn't render it by default) with a subtle click-ripple animation.

**Converting to MP4** — LinkedIn does not accept `.webm` uploads. Convert with any of:

- Local ffmpeg (if installed):
  `ffmpeg -i video/demo-video.webm -c:v libx264 -pix_fmt yuv420p -crf 22 video/demo-video.mp4`
- Online: [cloudconvert.com/webm-to-mp4](https://cloudconvert.com/webm-to-mp4)
- YouTube: upload as unlisted, then re-download the MP4

**Quality caveat.** This is a functional raw take, not a polished marketing edit. If you want smooth cursor tracking, click-triggered zooms, burned-in captions, or background music, treat this file as a rehearsal reference and re-record the same storyboard in Screen Studio, Descript, or ScreenFlow.

## Not-covered captures (potential future work)

The **AI-parser review dialog** — with proposed name-to-region bindings visible — is not captured by the marketing-screenshots script because mocking the SSE-based `/ai/parse` endpoint reliably is non-trivial. If you want that specific screenshot:

1. **Manual capture** — trigger the AI parser flow in the app yourself and screenshot the modal when the review UI appears. Takes 30 seconds.
2. **Real LLM call from Playwright** — extend the script to click through the AI parser flow and wait for the modal. Costs ~$0.01/run in LLM tokens; needs the server's `OPENAI_API_KEY` configured.
3. **Mocked SSE response** — extend the script with a `page.route()` interceptor for `/ai/parse` that streams a canned SSE response. Free and reproducible, but takes an hour to get right.

Option 1 is by far the fastest for a one-off marketing screenshot.

## Debugging tips

- If a routine fails, the script continues with the next one and prints a summary at the end.
- Selector regressions: the script relies on `data-i18n-key` attributes wherever possible for locale-independence. If the client renames one, both this script and `playwright-asset-generator.ts` need updating.
- Auth issues: delete `marketing/assets/.auth-state.json` to force a fresh login on the next run.
- Rate limiting on login: the login route rate-limiter is aggressive. If you hit it, wait 10-15 minutes before retrying.
