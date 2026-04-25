/**
 * Builds colored choropleth SVG strings and HTML wrappers for marketing showcase captures.
 * No network calls — uses data already in `data.csv` and the map SVG file.
 */
import { readFileSync } from 'node:fs';

import {
  longRowsToDivisions,
  readMarketingDataCsv,
  resolveDisplayYear,
  shouldUseGdpPerCapita,
} from './marketingDataCsv.ts';

type DivisionSlice = { svg_id: string; value: number }[];

type MetaJson = {
  name_en: string;
  dataset_label: string;
  dataset_year?: string;
  dataset_source?: string;
  seo_title?: string;
};

function interpolateColor(t: number): string {
  const light = { r: 219, g: 234, b: 254 };
  const dark = { r: 24, g: 41, b: 77 };
  const r = Math.round(light.r + (dark.r - light.r) * t);
  const g = Math.round(light.g + (dark.g - light.g) * t);
  const b = Math.round(light.b + (dark.b - light.b) * t);
  return `rgb(${r},${g},${b})`;
}

export function buildColoredMapSvgString(mapFilePath: string, divisions: DivisionSlice): string {
  const values = divisions.map((d) => d.value).filter((v) => Number.isFinite(v));
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 1;

  const colorMap = new Map<string, string>();
  for (const div of divisions) {
    if (!Number.isFinite(div.value)) continue;
    const t = maxVal === minVal ? 0.5 : (div.value - minVal) / (maxVal - minVal);
    colorMap.set(div.svg_id, interpolateColor(t));
  }

  let raw = readFileSync(mapFilePath, 'utf-8');
  raw = raw.replace(/^﻿/, '').replace(/^<\?xml[^>]*\?>\s*/i, '');
  raw = raw.replace(/\s+width="[^"]*"/gi, '').replace(/\s+height="[^"]*"/gi, '');
  if (!/\bviewBox\s*=/i.test(raw)) {
    raw = raw.replace(
      /<svg(\s[^>]*)>/i,
      '<svg$1 viewBox="0 0 820 820" width="100%" preserveAspectRatio="xMidYMid meet">',
    );
  } else {
    raw = raw.replace(
      /<svg(\s[^>]*)>/i,
      '<svg$1 width="100%" preserveAspectRatio="xMidYMid meet">',
    );
  }
  raw = raw.replace(/(<path\s[^>]*?)id="([^"]+)"([^>]*?>)/g, (_m, pre, id, post) => {
    const color = colorMap.get(id as string);
    if (!color) return `${pre as string}id="${id}"${post as string}`;
    return `${pre as string}id="${id}" fill="${color}" stroke="white" stroke-width="2"${post as string}`;
  });
  return raw;
}

export function loadDivisionsFromDataCsv(
  dataCsvPath: string,
  regionId: string,
  meta: MetaJson & { dataset_year?: string },
): ReturnType<typeof longRowsToDivisions> {
  const { longRows } = readMarketingDataCsv(dataCsvPath, meta);
  const y = resolveDisplayYear(meta, longRows);
  const useGdp = shouldUseGdpPerCapita(longRows, y);
  const divisions = longRowsToDivisions(longRows, y, regionId);
  if (!useGdp) {
    // Replace value with population for coloring
    return divisions.map((d) => ({ ...d, value: d.population }));
  }
  return divisions;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function wrapMapHtml(
  meta: MetaJson,
  mapSvgHtml: string,
  kind: 'viewport' | 'publicShare' | 'iframeInner',
): string {
  const mapBlock = `<div class="mkt-map-root" role="img" aria-label="${esc(`${meta.name_en} — ${meta.dataset_label}`)}">${mapSvgHtml}</div>`;

  if (kind === 'viewport') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(meta.name_en)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f8fafc; }
    .w { max-width: 900px; margin: 0 auto; padding: 20px; display: flex; flex-direction: column; align-items: stretch; gap: 12px; }
    .mkt-map-root svg { display: block; width: 100%; height: auto; }
    .mkt-timeline { margin: 0; height: 40px; padding: 0 10px; font: 11px/1.2 system-ui, sans-serif; color: #334155; text-align: center; background: #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-sizing: border-box; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  </style>
</head>
<body>
  <div class="w">
    <div class="mkt-map-wrap">${mapBlock}</div>
    <p class="mkt-timeline" id="regionify-mkt-timeline" aria-live="polite"> </p>
  </div>
</body>
</html>`;
  }

  if (kind === 'iframeInner') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; height: 100%; background: #fff; }
    body { display: flex; align-items: center; justify-content: center; padding: 8px; }
    .wrap { width: 100%; }
    .mkt-map-root svg { display: block; width: 100%; height: auto; }
  </style>
</head>
<body>
  <div class="wrap">${mapBlock}</div>
</body>
</html>`;
  }

  // publicShare — unused in new flow (we screenshot the real embed page) but kept for reference
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(`${meta.name_en} — ${meta.seo_title ?? ''}`)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f1f5f9; min-height: 100vh; font-family: system-ui, sans-serif; }
    .bar { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 14px 20px; }
    .bar h1 { font-size: 1.1rem; margin: 0; color: #0f172a; font-weight: 600; }
    .bar p { margin: 4px 0 0; font-size: 0.85rem; color: #64748b; }
    .in { max-width: 1000px; margin: 0 auto; padding: 24px 20px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
    .mkt-map-root svg { display: block; width: 100%; height: auto; }
  </style>
</head>
<body>
  <div class="bar">
    <h1>${esc(meta.name_en)}</h1>
    <p>${esc(meta.dataset_label)} · ${esc(String(meta.dataset_year ?? ''))} · ${esc(meta.dataset_source ?? '')}</p>
  </div>
  <div class="in">
    <div class="card">${mapBlock}</div>
  </div>
</body>
</html>`;
}
