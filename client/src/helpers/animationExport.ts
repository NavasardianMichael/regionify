import { applyPalette, GIFEncoder, quantize } from 'gifenc';
import type { LegendItem } from '@/store/legendData/types';
import type { DataSet } from '@/store/mapData/types';
import type {
  BorderConfig,
  PictureConfig,
  RegionLabelPositions,
  RegionLabelsConfig,
  ShadowConfig,
} from '@/store/mapStyles/types';
import { resolveOpaqueMapBackgroundColor } from '@/constants/mapStyles';
import { getInterpolatedColorMap, smoothstep01 } from '@/helpers/legendColorInterpolation';
import {
  cropCanvas,
  type CropRect,
  drawLegendOnCanvas,
  drawWatermark,
  MAP_EXPORT_BOTTOM_LEGEND,
  MAP_EXPORT_FLOATING_LEGEND,
  MAP_EXPORT_ROOT,
  MAP_EXPORT_TIME_PERIOD_LABEL,
  MAP_SVG_SELECTOR,
  type MapExportLegendDrawOptions,
  type StillExportOpts,
} from '@/helpers/mapExport';
import { renderStyledSvg } from './svgRenderer';

const PREVIEW_FPS = 30;
const DEFAULT_SECONDS_PER_PERIOD = 1;
const TRANSITION_FRAMES_WHEN_SMOOTH = 30;

export type LegendPositionExport = 'bottom' | 'floating';

type AnimationExportOptions = {
  rawSvg: string;
  timePeriods: string[];
  timelineData: Record<string, DataSet>;
  legendItems: LegendItem[];
  noDataColor: string;
  border: BorderConfig;
  shadow: ShadowConfig;
  picture: PictureConfig;
  /** When null, no legend overlay (hidden in UI or no ranges). */
  legendDraw: MapExportLegendDrawOptions | null;
  quality: number;
  /** Output frame rate (e.g. 30 for video/GIF). */
  fps: number;
  /** Seconds to show each time period (default 2). Drives hold frames per period. */
  secondsPerPeriod?: number;
  /** When true, add intermediate frames between periods for smooth transitions. */
  smooth?: boolean;
  /** Legend position for export (matches visualizer). */
  legendPosition?: LegendPositionExport;
  /** Region labels config (show, color, fontSize). When set, labels are drawn on export. */
  regionLabels?: RegionLabelsConfig;
  /** Optional positions for region labels (path id → { x, y }). */
  labelPositions?: RegionLabelPositions;
  /** Optional crop rectangle applied to every frame. */
  cropRect?: CropRect;
  /** Drawn on each frame after crop (matches static map export watermark). */
  watermark?: StillExportOpts['watermark'];
  onProgress?: (progress: number) => void;
};

/**
 * Total frame count for animation (for UI duration estimate).
 * Smooth mode uses the same budget as instant mode: transitions replace hold frames, not add to them
 * (including the blend from the last period back to the first for seamless GIF / video loops).
 */
export const getAnimationTotalFrames = (
  timePeriodCount: number,
  options: {
    secondsPerPeriod?: number;
    fps?: number;
  } = {},
): number => {
  const fps = options.fps ?? PREVIEW_FPS;
  const secondsPerPeriod = options.secondsPerPeriod ?? DEFAULT_SECONDS_PER_PERIOD;
  const holdFrames = Math.max(1, Math.round(secondsPerPeriod * fps));
  if (timePeriodCount <= 0) return 0;
  return timePeriodCount * holdFrames;
};

/** Quality (1–100) maps to a canvas scale multiplier. */
const qualityToScale = (quality: number): number => Math.max(0.5, quality / 25);

/** Hold = solid period data; blend = interpolate from `fromIndex` to `toIndex` (t in [0, 1] along the segment). */
type FrameSpec =
  | { type: 'hold'; periodIndex: number; label: string }
  | { type: 'blend'; fromIndex: number; toIndex: number; t: number; label: string };

/**
 * Hold frames per period + optional smooth transitions between periods.
 * Same total duration as `instant` mode: transition frames are taken from the per-period
 * seconds budget (shorter holds), not appended.
 * Blend segments use smoothstep on linear t so easing applies at both ends (leaving A and entering B).
 * In smooth mode, an extra segment blends the last period back into the first so GIF / looping
 * video does not jump when the playback restarts.
 */
const buildFrameList = (
  timePeriods: string[],
  opts: {
    secondsPerPeriod: number;
    fps: number;
    smooth: boolean;
  },
): FrameSpec[] => {
  const list: FrameSpec[] = [];
  if (timePeriods.length === 0) return list;

  const n = timePeriods.length;
  const baseHoldFrames = Math.max(1, Math.round(opts.secondsPerPeriod * opts.fps));
  const targetTotalFrames = n * baseHoldFrames;

  if (n === 1) {
    for (let k = 0; k < baseHoldFrames; k++) {
      list.push({ type: 'hold', periodIndex: 0, label: timePeriods[0] });
    }
    return list;
  }

  const numGaps = opts.smooth ? n : n - 1;
  let transitionFrames = 0;
  if (opts.smooth) {
    const maxTransitionByBudget = Math.floor((targetTotalFrames - n) / numGaps);
    transitionFrames = Math.min(TRANSITION_FRAMES_WHEN_SMOOTH, Math.max(0, maxTransitionByBudget));
  }

  const totalHoldFrames = targetTotalFrames - numGaps * transitionFrames;
  const holdBase = Math.floor(totalHoldFrames / n);
  const remainder = totalHoldFrames % n;
  const holdsPerPeriod = timePeriods.map((_, i) => holdBase + (i < remainder ? 1 : 0));

  for (let i = 0; i < n; i++) {
    for (let k = 0; k < holdsPerPeriod[i]; k++) {
      list.push({ type: 'hold', periodIndex: i, label: timePeriods[i] });
    }
    // `transitionFrames` is only non-zero when `opts.smooth`; then blend after every period,
    // including last → first, so looping exports stay continuous.
    if (transitionFrames > 0) {
      const toIndex = (i + 1) % n;
      const steps = Math.max(2, transitionFrames);
      for (let k = 0; k < steps; k++) {
        const t = k / (steps - 1);
        const label = t >= 0.5 ? timePeriods[toIndex] : timePeriods[i];
        list.push({ type: 'blend', fromIndex: i, toIndex, t, label });
      }
    }
  }
  return list;
};

/** Renders an SVG string onto a canvas at the given scale. */
const svgToCanvas = (svgString: string, scale: number): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render SVG to image'));
    };

    img.src = url;
  });
};

/**
 * Same idea as still `generateMapCanvas`: the map SVG is shown at CSS size in the viewer, but `renderStyledSvg`
 * keeps document/intrinsic sizing. Rasterize at getBoundingClientRect × layoutScale so GIF/MP4/crop preview match
 * the map visualization block (legend DOM mapping stays consistent).
 */
const getDisplayedMapSvgPixelSize = (layoutScale: number): { w: number; h: number } | null => {
  if (typeof document === 'undefined') return null;
  const svgEl = document.querySelector<SVGSVGElement>(MAP_SVG_SELECTOR);
  if (!svgEl) return null;
  const r = svgEl.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return {
    w: Math.max(1, Math.round(r.width * layoutScale)),
    h: Math.max(1, Math.round(r.height * layoutScale)),
  };
};

const setRootSvgPixelDimensions = (svgMarkup: string, width: number, height: number): string => {
  const w = Math.round(width);
  const h = Math.round(height);
  return svgMarkup.replace(/<svg\b([^>]*)>/i, (_full, attrs: string) => {
    const stripped = attrs
      .replace(/\swidth\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\sheight\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    return `<svg${stripped} width="${w}" height="${h}">`;
  });
};

const styledSvgToMapCanvas = async (
  svgString: string,
  layoutScale: number,
): Promise<HTMLCanvasElement> => {
  const layoutDims = getDisplayedMapSvgPixelSize(layoutScale);
  if (layoutDims) {
    const sized = setRootSvgPixelDimensions(svgString, layoutDims.w, layoutDims.h);
    return svgToCanvas(sized, 1);
  }
  return svgToCanvas(svgString, layoutScale);
};

/** Pill top at `pillTopY`, horizontally centered on `centerX` (export frame coordinates). */
const drawPeriodLabelPillTopCenter = (
  ctx: CanvasRenderingContext2D,
  label: string,
  mapAreaWidth: number,
  centerX: number,
  pillTopY: number,
): void => {
  const fontSize = Math.max(14, Math.round(mapAreaWidth / 40));
  ctx.save();
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;

  const metrics = ctx.measureText(label);
  const textWidth = metrics.width;
  const paddingX = fontSize * 0.6;
  const paddingY = fontSize * 0.4;

  const pillWidth = textWidth + paddingX * 2;
  const pillHeight = fontSize + paddingY * 2;
  const pillX = centerX - pillWidth / 2;
  const pillY = pillTopY;
  const radius = pillHeight / 2;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, radius);
  ctx.fill();

  ctx.fillStyle = '#18294D';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, centerX, pillY + pillHeight / 2);
  ctx.restore();
};

/**
 * Time period pill centered on the map area. When `mapArea` is omitted, uses the full canvas
 * (map-only fallback).
 */
const addPeriodLabel = (
  canvas: HTMLCanvasElement,
  label: string,
  mapArea?: { x: number; y: number; w: number; h: number },
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const area = mapArea ?? { x: 0, y: 0, w: canvas.width, h: canvas.height };
  const fontSize = Math.max(14, Math.round(area.w / 40));
  const paddingY = fontSize * 0.4;
  drawPeriodLabelPillTopCenter(ctx, label, area.w, area.x + area.w / 2, area.y + paddingY);
};

type DomLegendMeasure = {
  svgRect: DOMRect;
  legendRect: DOMRect;
  kind: 'floating' | 'bottom';
};

const measureDomLegendLayout = (legendPosition: LegendPositionExport): DomLegendMeasure | null => {
  if (typeof document === 'undefined') return null;
  const svgEl = document.querySelector<SVGSVGElement>(MAP_SVG_SELECTOR);
  if (!svgEl) return null;
  const svgRect = svgEl.getBoundingClientRect();
  const sw = Math.max(1e-6, svgRect.width);
  const sh = Math.max(1e-6, svgRect.height);
  if (sw < 4 || sh < 4) return null;

  if (legendPosition === 'floating') {
    const leg = document.querySelector<HTMLElement>(MAP_EXPORT_FLOATING_LEGEND);
    if (!leg) return null;
    const legendRect = leg.getBoundingClientRect();
    return { svgRect, legendRect, kind: 'floating' };
  }

  const leg = document.querySelector<HTMLElement>(MAP_EXPORT_BOTTOM_LEGEND);
  if (!leg) return null;
  const legendRect = leg.getBoundingClientRect();
  return { svgRect, legendRect, kind: 'bottom' };
};

/**
 * Aligns animation legend with the live map (same approach as static composite export).
 * Uses export `layoutScale` for typography so legend size tracks quality like still exports.
 */
const applyAnimationLegendOverlay = (
  mapCanvas: HTMLCanvasElement,
  layoutScale: number,
  legendDraw: MapExportLegendDrawOptions,
  legendPosition: LegendPositionExport,
): HTMLCanvasElement => {
  if (legendDraw.items.length === 0) return mapCanvas;

  const measured = measureDomLegendLayout(legendPosition);
  if (!measured) {
    return applyAnimationLegendFallback(mapCanvas, layoutScale, legendDraw);
  }

  const { svgRect, legendRect, kind } = measured;
  const sw = Math.max(1e-6, svgRect.width);
  const sh = Math.max(1e-6, svgRect.height);

  if (kind === 'floating') {
    const ctx = mapCanvas.getContext('2d');
    if (!ctx) return mapCanvas;
    const x = ((legendRect.left - svgRect.left) / sw) * mapCanvas.width;
    const y = ((legendRect.top - svgRect.top) / sh) * mapCanvas.height;
    const w = (legendRect.width / sw) * mapCanvas.width;
    const h = (legendRect.height / sh) * mapCanvas.height;
    drawLegendOnCanvas(
      ctx,
      { x, y, w: Math.max(1, w), h: Math.max(1, h) },
      legendDraw,
      layoutScale,
    );
    return mapCanvas;
  }

  const ratio = legendRect.height / sh;
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return applyAnimationLegendFallback(mapCanvas, layoutScale, legendDraw);
  }

  const extraH = Math.max(1, Math.round(mapCanvas.height * ratio));
  const out = document.createElement('canvas');
  out.width = mapCanvas.width;
  out.height = mapCanvas.height + extraH;
  const ctx = out.getContext('2d');
  if (!ctx) return mapCanvas;
  ctx.drawImage(mapCanvas, 0, 0);
  drawLegendOnCanvas(
    ctx,
    { x: 0, y: mapCanvas.height, w: out.width, h: extraH },
    legendDraw,
    layoutScale,
  );
  return out;
};

/** When the map is not in the DOM (or markers missing), add a bottom strip so the legend is never omitted. */
const applyAnimationLegendFallback = (
  mapCanvas: HTMLCanvasElement,
  layoutScale: number,
  legendDraw: MapExportLegendDrawOptions,
): HTMLCanvasElement => {
  const pad = Math.round(8 * layoutScale);
  const swatch = Math.round(12 * layoutScale);
  const fontSize = Math.max(11, Math.round(legendDraw.labels.fontSize * layoutScale));
  const rowGap = Math.round(8 * layoutScale);
  const titleGap = Math.round(12 * layoutScale);

  let innerH = pad * 2;
  if (legendDraw.title.show && legendDraw.title.text.trim()) {
    innerH += fontSize + titleGap;
  }
  innerH += (legendDraw.items.length + 1) * (Math.max(swatch, fontSize) + rowGap) - rowGap;

  const stripH = Math.min(
    Math.max(Math.round(innerH + pad), Math.round(48 * layoutScale)),
    Math.round(mapCanvas.height * 0.45),
  );

  const out = document.createElement('canvas');
  out.width = mapCanvas.width;
  out.height = mapCanvas.height + stripH;
  const ctx = out.getContext('2d');
  if (!ctx) return mapCanvas;
  ctx.drawImage(mapCanvas, 0, 0);
  drawLegendOnCanvas(
    ctx,
    { x: 0, y: mapCanvas.height, w: out.width, h: stripH },
    legendDraw,
    layoutScale,
  );
  return out;
};

/**
 * Match still `generateMapCanvas`: canvas size = export root, map at SVG offset, legend by DOM rect.
 * Map-only raster clips floating legends that sit outside the SVG element; this fixes that.
 */
const compositeAnimationFrameToExportRoot = async (
  mapCanvas: HTMLCanvasElement,
  layoutScale: number,
  options: FrameOptions,
  periodLabel: string,
): Promise<HTMLCanvasElement> => {
  const fallback = (): HTMLCanvasElement => {
    let c = mapCanvas;
    if (options.legendDraw) {
      c = applyAnimationLegendOverlay(
        c,
        layoutScale,
        options.legendDraw,
        options.legendPosition ?? 'bottom',
      );
    }
    addPeriodLabel(c, periodLabel);
    return c;
  };

  if (typeof document === 'undefined') return fallback();

  await new Promise<void>((r) => {
    requestAnimationFrame(() => r());
  });

  const root = document.querySelector<HTMLElement>(MAP_EXPORT_ROOT);
  const svgEl = root?.querySelector<SVGSVGElement>(MAP_SVG_SELECTOR);
  if (!root || !svgEl) return fallback();

  const rootRect = root.getBoundingClientRect();
  const svgRect = svgEl.getBoundingClientRect();
  const W = Math.max(1, Math.round(rootRect.width * layoutScale));
  const H = Math.max(1, Math.round(rootRect.height * layoutScale));

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return fallback();

  if (!options.picture.transparentBackground) {
    ctx.fillStyle = resolveOpaqueMapBackgroundColor(options.picture);
    ctx.fillRect(0, 0, W, H);
  }

  const sx = (svgRect.left - rootRect.left) * layoutScale;
  const sy = (svgRect.top - rootRect.top) * layoutScale;
  ctx.drawImage(mapCanvas, sx, sy);

  if (options.legendDraw && options.legendDraw.items.length > 0) {
    const legendEl =
      root.querySelector<HTMLElement>(MAP_EXPORT_FLOATING_LEGEND) ??
      root.querySelector<HTMLElement>(MAP_EXPORT_BOTTOM_LEGEND);
    if (legendEl) {
      const lr = legendEl.getBoundingClientRect();
      const lx = (lr.left - rootRect.left) * layoutScale;
      const ly = (lr.top - rootRect.top) * layoutScale;
      const lw = Math.max(1, lr.width * layoutScale);
      const lh = Math.max(1, lr.height * layoutScale);
      drawLegendOnCanvas(ctx, { x: lx, y: ly, w: lw, h: lh }, options.legendDraw, layoutScale);
    }
  }

  const pillEl = root.querySelector<HTMLElement>(MAP_EXPORT_TIME_PERIOD_LABEL);
  if (pillEl) {
    const pr = pillEl.getBoundingClientRect();
    const centerX = (pr.left + pr.width / 2 - rootRect.left) * layoutScale;
    const pillTopY = (pr.top - rootRect.top) * layoutScale;
    drawPeriodLabelPillTopCenter(ctx, periodLabel, mapCanvas.width, centerX, pillTopY);
  } else {
    addPeriodLabel(canvas, periodLabel, {
      x: sx,
      y: sy,
      w: mapCanvas.width,
      h: mapCanvas.height,
    });
  }

  return canvas;
};

const triggerDownload = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

type FrameOptions = Pick<
  AnimationExportOptions,
  | 'legendItems'
  | 'noDataColor'
  | 'border'
  | 'shadow'
  | 'picture'
  | 'legendDraw'
  | 'legendPosition'
  | 'regionLabels'
  | 'labelPositions'
>;

/** Render a single frame canvas for the given time period (no interpolation). */
const renderFrame = async (
  rawSvg: string,
  data: DataSet,
  period: string,
  scale: number,
  options: FrameOptions,
): Promise<HTMLCanvasElement> => {
  const svgString = renderStyledSvg({
    rawSvg,
    data,
    legendItems: options.legendItems,
    noDataColor: options.noDataColor,
    border: options.border,
    shadow: options.shadow,
    picture: options.picture,
    regionLabels: options.regionLabels,
    labelPositions: options.labelPositions,
  });
  const mapCanvas = await styledSvgToMapCanvas(svgString, scale);
  return compositeAnimationFrameToExportRoot(mapCanvas, scale, options, period);
};

/** Render a single frame with colors interpolated between two data sets. t in [0, 1]. */
const renderInterpolatedFrame = async (
  rawSvg: string,
  dataA: DataSet,
  dataB: DataSet,
  t: number,
  label: string,
  scale: number,
  options: FrameOptions,
): Promise<HTMLCanvasElement> => {
  const colorMap = getInterpolatedColorMap(
    dataA,
    dataB,
    t,
    options.legendItems,
    options.noDataColor,
  );
  const svgString = renderStyledSvg({
    rawSvg,
    data: dataA,
    legendItems: options.legendItems,
    noDataColor: options.noDataColor,
    border: options.border,
    shadow: options.shadow,
    picture: options.picture,
    colorMap,
    regionLabels: options.regionLabels,
    labelPositions: options.labelPositions,
  });
  const mapCanvas = await styledSvgToMapCanvas(svgString, scale);
  return compositeAnimationFrameToExportRoot(mapCanvas, scale, options, label);
};

/** Render the frame for a given FrameSpec (solid hold or blend between neighbors). */
const renderFrameForSpec = async (
  rawSvg: string,
  timelineData: Record<string, DataSet>,
  timePeriods: string[],
  spec: FrameSpec,
  scale: number,
  options: FrameOptions,
): Promise<HTMLCanvasElement> => {
  if (spec.type === 'hold') {
    return renderFrame(
      rawSvg,
      timelineData[timePeriods[spec.periodIndex]],
      spec.label,
      scale,
      options,
    );
  }
  const dataA = timelineData[timePeriods[spec.fromIndex]];
  const dataB = timelineData[timePeriods[spec.toIndex]];
  const tColor = smoothstep01(spec.t);
  return renderInterpolatedFrame(rawSvg, dataA, dataB, tColor, spec.label, scale, options);
};

/**
 * Generates a preview canvas for the first frame of the animation.
 * Used by the crop step to show and crop the animation preview.
 */
export const generateAnimationPreviewCanvas = async (
  options: Omit<AnimationExportOptions, 'fps' | 'secondsPerPeriod' | 'smooth' | 'onProgress'>,
): Promise<HTMLCanvasElement | null> => {
  const { rawSvg, timePeriods, timelineData, quality } = options;
  if (timePeriods.length === 0) return null;

  const scale = qualityToScale(quality);
  const firstPeriod = timePeriods[0];
  const data = timelineData[firstPeriod];
  if (!data) return null;

  const spec: FrameSpec = { type: 'hold', periodIndex: 0, label: firstPeriod };
  const canvas = await renderFrameForSpec(rawSvg, timelineData, timePeriods, spec, scale, options);
  return finalizeAnimationFrame(canvas, options.cropRect, options.watermark);
};

/** Apply optional crop to a frame canvas. */
const maybeApplyCrop = (
  canvas: HTMLCanvasElement,
  crop: CropRect | undefined,
): HTMLCanvasElement => {
  if (!crop) return canvas;
  return cropCanvas(canvas, crop);
};

const applyWatermarkIfAny = async (
  canvas: HTMLCanvasElement,
  watermark: StillExportOpts['watermark'] | undefined,
): Promise<void> => {
  if (!watermark) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  await drawWatermark(ctx, canvas.width, canvas.height, watermark);
};

const finalizeAnimationFrame = async (
  canvas: HTMLCanvasElement,
  cropRect: CropRect | undefined,
  watermark: StillExportOpts['watermark'] | undefined,
): Promise<HTMLCanvasElement> => {
  const cropped = maybeApplyCrop(canvas, cropRect);
  await applyWatermarkIfAny(cropped, watermark);
  return cropped;
};

/** Export animation as GIF using gifenc with smooth color transitions and stable global palette. */
export const exportAnimationAsGif = async (options: AnimationExportOptions): Promise<void> => {
  const {
    rawSvg,
    timePeriods,
    timelineData,
    quality,
    fps,
    secondsPerPeriod = DEFAULT_SECONDS_PER_PERIOD,
    smooth = true,
    cropRect,
    watermark,
    onProgress,
  } = options;

  const scale = qualityToScale(quality);
  const delay = Math.round(1000 / fps);
  const frameList = buildFrameList(timePeriods, {
    secondsPerPeriod,
    fps,
    smooth,
  });
  const totalFrames = frameList.length;

  if (totalFrames === 0) return;

  const sampleIndices = [0, Math.floor(totalFrames / 2), totalFrames - 1].filter(
    (a, i, arr) => arr.indexOf(a) === i,
  );

  const sampleCanvases: HTMLCanvasElement[] = [];
  for (let i = 0; i < sampleIndices.length; i++) {
    const raw = await renderFrameForSpec(
      rawSvg,
      timelineData,
      timePeriods,
      frameList[sampleIndices[i]],
      scale,
      options,
    );
    sampleCanvases.push(await finalizeAnimationFrame(raw, cropRect, watermark));
  }
  const { width, height } = sampleCanvases[0];

  const samplePixels = new Uint8ClampedArray(sampleIndices.length * width * height * 4);
  for (let i = 0; i < sampleIndices.length; i++) {
    const ctx = sampleCanvases[i].getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    const imageData = ctx.getImageData(0, 0, width, height);
    samplePixels.set(imageData.data, i * imageData.data.length);
  }
  const globalPalette = quantize(samplePixels, 256);

  const gif = GIFEncoder();
  const sampleIndexSet = new Set(sampleIndices);

  for (let i = 0; i < totalFrames; i++) {
    const rawCanvas = sampleIndexSet.has(i)
      ? sampleCanvases[sampleIndices.indexOf(i)]
      : await finalizeAnimationFrame(
          await renderFrameForSpec(rawSvg, timelineData, timePeriods, frameList[i], scale, options),
          cropRect,
          watermark,
        );
    const ctx = rawCanvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    const imageData = ctx.getImageData(0, 0, width, height);
    const index = applyPalette(imageData.data, globalPalette);
    gif.writeFrame(index, width, height, { palette: globalPalette, delay });
    onProgress?.((i + 1) / totalFrames);
  }

  gif.finish();
  const bytes = gif.bytes();
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'image/gif' });
  triggerDownload(blob, 'regionify-animation.gif');
};

/** Export animation as MP4/WebM video from canvas with smooth color transitions. */
export const exportAnimationAsVideo = async (options: AnimationExportOptions): Promise<void> => {
  const {
    rawSvg,
    timePeriods,
    timelineData,
    quality,
    fps,
    secondsPerPeriod = DEFAULT_SECONDS_PER_PERIOD,
    smooth = true,
    cropRect,
    watermark,
    onProgress,
  } = options;

  const scale = qualityToScale(quality);
  const frameList = buildFrameList(timePeriods, {
    secondsPerPeriod,
    fps,
    smooth,
  });
  const totalFrames = frameList.length;
  const frameDurationMs = 1000 / fps;

  if (totalFrames === 0) return;

  const firstCanvas = await finalizeAnimationFrame(
    await renderFrameForSpec(rawSvg, timelineData, timePeriods, frameList[0], scale, options),
    cropRect,
    watermark,
  );
  const { width, height } = firstCanvas;

  const recordCanvas = document.createElement('canvas');
  recordCanvas.width = width;
  recordCanvas.height = height;
  const recordCtx = recordCanvas.getContext('2d');
  if (!recordCtx) throw new Error('Failed to get recording canvas context');

  const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
    ? 'video/mp4;codecs=avc1'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

  const isMP4 = mimeType.startsWith('video/mp4');
  const extension = isMP4 ? 'mp4' : 'webm';
  const baseMime = mimeType.split(';')[0];

  const stream = recordCanvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 12_000_000,
  });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e: BlobEvent) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const videoBlob = await new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('Recording failed'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: baseMime }));

    recorder.start();

    const drawAndCapture = (canvas: HTMLCanvasElement): Promise<void> => {
      recordCtx.clearRect(0, 0, width, height);
      recordCtx.drawImage(canvas, 0, 0);

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && 'requestFrame' in videoTrack) {
        (videoTrack as unknown as { requestFrame: () => void }).requestFrame();
      }

      return new Promise<void>((r) => setTimeout(r, frameDurationMs));
    };

    const renderFrames = async (): Promise<void> => {
      recordCtx.clearRect(0, 0, width, height);
      recordCtx.drawImage(firstCanvas, 0, 0);
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && 'requestFrame' in videoTrack) {
        (videoTrack as unknown as { requestFrame: () => void }).requestFrame();
      }
      await new Promise<void>((r) => setTimeout(r, frameDurationMs));
      onProgress?.(1 / totalFrames);

      for (let i = 1; i < totalFrames; i++) {
        const canvas = await finalizeAnimationFrame(
          await renderFrameForSpec(rawSvg, timelineData, timePeriods, frameList[i], scale, options),
          cropRect,
          watermark,
        );
        await drawAndCapture(canvas);
        onProgress?.((i + 1) / totalFrames);
      }

      recorder.stop();
    };

    renderFrames().catch(reject);
  });

  triggerDownload(videoBlob, `regionify-animation.${extension}`);
};
