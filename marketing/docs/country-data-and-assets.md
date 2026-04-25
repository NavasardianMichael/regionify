# Country data and marketing assets

This document describes how **regional (first-level) data**, **static** marketing pages, and **generated** showcase assets (PNGs, GIFs, WebMs) work together. It reflects the pipeline consolidated around a **single long-format CSV per country**—no separate `panel.csv` or derived one-year-only tables.

## One file per country: `data.csv`

Each country folder under `assets/{slug}/` includes:

| File           | Role                                                                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`data.csv`** | **Canonical** subnational data: one row per **region** per **year** (long format). Drives the country page map, still images, and animated showcases. |
| `meta.json`    | Human-readable title, `dataset_year` (optional but recommended), `division_type`, map hints, etc.                                                     |
| `sources.json` | Provenance and notes for the marketing site.                                                                                                          |
| `showcases/*`  | Generated stills and animations (see [Generated assets](#generated-assets)).                                                                          |

**Header** (strict long form):

```text
name_en,name_local,svg_id,year,population,area_km2,value
```

- **`value`** is the measure used for choropleth coloring (e.g. GDP per capita).
- **Legacy** CSVs **without** a `year` column are still supported: they are treated as a single cohort, and the display year comes from `meta.json`’s `dataset_year`, with a year fallback if missing.

**Alias:** `gdp_per_capita` is accepted as an alias for `value` when parsing (for older hand-maintained files).

## Static vs dynamic use of the same file

| Context                                                             | How years are chosen                                                                                                                                                                                                    |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Static** (Astro country pages, still PNGs/SVGs used in marketing) | Use **`resolveDisplayYear`**: if `meta.dataset_year` is set **and** that year exists in the long rows, use it; otherwise use the **latest** year present in `data.csv`. Map divisions are the slice for that year only. |
| **Dynamic** (offline GIF/WebM generation)                           | Use **all distinct years** in `data.csv`. If **two or more** years: animation uses the **last two** years (pair of maps + regional captions). If **one** year: high/low region captions, same as before.                |

The site does **not** need a second “panel-only” or one-year export: one `data.csv` is the source of truth for both.

## Shared parsing (Node and Astro)

- **Node** (`scripts/lib/marketingDataCsv.mjs`): `parseMarketingDataContent`, `readMarketingDataCsv`, `resolveDisplayYear`, `longRowsToDivisions`, `selectSliceForMapYear`.
- **TypeScript** (`src/data/marketingCsv.ts` + `parseCountries.ts`): aligned logic for Astro; country rows expose a **resolved** `dataset_year` for JSON-LD and the UI.

`scripts/lib/panelData.mjs` is a thin **re-export** of the marketing CSV helpers for older import paths; the old “derive `data.csv` from `panel.csv`” flow is **removed**.

## Generated assets

**Script:** `scripts/generate-showcase-assets.mjs`

- Inputs: `assets/{slug}/data.csv`, `assets/{slug}/meta.json`, and the map SVG from the main app’s map assets.
- Output: e.g. `showcases/*.png`, `*.gif`, `*.webm` under that country’s `assets` folder.
- **No** national `timeseries.json` is read here; animation is driven **only** by regional rows in `data.csv`.

**HTML helpers:** `scripts/lib/showcaseChoroplethHtml.mjs` loads divisions from `data.csv` **with** `meta` so the display year and column semantics stay consistent with the rest of the pipeline.

## `marketing-assets` CLI

`scripts/marketing-assets.mjs` orchestrates per-country work. It **requires** that `data.csv` already exists (or is produced by a fetcher). It does **not** copy or derive a second regional table from a panel file.

**Optional** national data:

- `--fetch-national` runs `fetch-showcase-time-series.mjs`, which can write **`timeseries.json`** (World Bank national series for attribution / future use).
- **Nothing** in the marketing site or showcase generator **reads** `timeseries.json` today. Choropleth and exports use **`data.csv` only**; you can skip national fetch and omit or delete `timeseries.json` if you do not need that file in the repo.

## Fetchers: writing `data.csv`

Country-specific fetchers (e.g. `scripts/fetchers/russia.mjs`) are responsible for **refreshing** long-format `data.csv` with the header above, not a separate `panel.csv`.

`scripts/fetch-panel.mjs` still runs the registered **`panel_fetcher`** for each country; naming is historical—the expected output is the same **regional** `data.csv` contract.

## Files intentionally not required

| File              | Status                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `panel.csv`       | **Removed** from the design; do not add it for new countries.                             |
| `timeseries.json` | **Optional**; national WB metadata only, not used by static pages or showcase generation. |

## Summary

1. **One** regional **`data.csv`** per country, long format, multi-year when you have history.
2. **Static** content uses a **single resolved display year** (prefer `meta.dataset_year` when that year exists in data, else max year).
3. **Showcase animations** use **all years in `data.csv`** (last two for dual-frame GIF/WebM when applicable).
4. **National** `timeseries.json` is an optional, non-consuming artifact; **regional** choropleth data lives entirely in `data.csv`.
