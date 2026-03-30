import { applyPalette, GIFEncoder, quantize } from 'gifenc';
import type { LegendItem } from '@/store/legendData/types';
import type { LegendLabelsConfig, LegendTitleConfig } from '@/store/legendStyles/types';
import type { DataSet } from '@/store/mapData/types';
import type {
  BorderConfig,
  PictureConfig,
  RegionLabelPositions,
  RegionLabelsConfig,
  ShadowConfig,
} from '@/store/mapStyles/types';
import { getInterpolatedColorMap, smoothstep01 } from '@/helpers/legendColorInterpolation';
import { cropCanvas, type CropRect } from '@/helpers/mapExport';
import { renderStyledSvg } from './svgRenderer';

const LEGEND_REFERENCE_SIZE = 800;
const PREVIEW_FPS = 30;
const DEFAULT_SECONDS_PER_PERIOD = 2;
const TRANSITION_FRAMES_WHEN_SMOOTH = 30;

type LegendConfig = {
  title: LegendTitleConfig;
  labels: LegendLabelsConfig;
  backgroundColor: string;
};

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
  legend: LegendConfig;
  quality: number;
  /** Output frame rate (e.g. 30 for video/GIF). */
  fps: number;
  /** Seconds to show each time period (default 2). Drives hold frames per period. */
  secondsPerPeriod?: number;
  /** When true, add intermediate frames between periods for smooth transitions. */
  smooth?: boolean;
  /** Legend position for export. */
  legendPosition?: LegendPositionExport;
  /** Legend position in pixels when legendPosition is 'floating'. Scaled to canvas. */
  floatingPosition?: { x: number; y: number };
  /** Region labels config (show, color, fontSize). When set, labels are drawn on export. */
  regionLabels?: RegionLabelsConfig;
  /** Optional positions for region labels (path id → { x, y }). */
  labelPositions?: RegionLabelPositions;
  /** Optional crop rectangle applied to every frame. */
  cropRect?: CropRect;
  onProgress?: (progress: number) => void;
};

/**
 * Total frame count for animation (for UI duration estimate).
 * Smooth mode uses the same budget as instant mode: transitions replace hold frames, not add to them.
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

/** Hold = solid period data; blend = interpolate from fromIndex to fromIndex+1 (t in [0, 1] linear along gap). */
type FrameSpec =
  | { type: 'hold'; periodIndex: number; label: string }
  | { type: 'blend'; fromIndex: number; t: number; label: string };

/**
 * Hold frames per period + optional smooth transitions between periods.
 * Same total duration as `instant` mode: transition frames are taken from the per-period
 * seconds budget (shorter holds), not appended.
 * Blend segments use smoothstep on linear t so easing applies at both ends (leaving A and entering B).
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

  const numGaps = n - 1;
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
    if (i < n - 1 && transitionFrames > 0) {
      const steps = Math.max(2, transitionFrames);
      for (let k = 0; k < steps; k++) {
        const t = k / (steps - 1);
        const label = t >= 0.5 ? timePeriods[i + 1] : timePeriods[i];
        list.push({ type: 'blend', fromIndex: i, t, label });
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

/** Adds a time period label overlay on a canvas. */
const addPeriodLabel = (canvas: HTMLCanvasElement, label: string): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const fontSize = Math.max(14, Math.round(canvas.width / 40));

  ctx.save();
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;

  const metrics = ctx.measureText(label);
  const textWidth = metrics.width;
  const paddingX = fontSize * 0.6;
  const paddingY = fontSize * 0.4;
  const x = canvas.width / 2;
  const y = fontSize + paddingY * 2;

  // Background pill
  const pillWidth = textWidth + paddingX * 2;
  const pillHeight = fontSize + paddingY * 2;
  const pillX = x - pillWidth / 2;
  const pillY = y - fontSize - paddingY;
  const radius = pillHeight / 2;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, radius);
  ctx.fill();

  // Text
  ctx.fillStyle = '#18294D';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, pillY + pillHeight / 2);
  ctx.restore();
};

type AddLegendOptions = LegendConfig & {
  position?: LegendPositionExport;
  floatingPosition?: { x: number; y: number };
};

/** Draws the legend box overlay. Position: bottom-left by default, or floating at given position. */
const addLegend = (
  canvas: HTMLCanvasElement,
  legendItems: LegendItem[],
  noDataColor: string,
  legend: AddLegendOptions,
): void => {
  if (legendItems.length === 0) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();

  const scale = Math.max(1, canvas.width / LEGEND_REFERENCE_SIZE);
  const fontSize = Math.max(11, Math.round(legend.labels.fontSize * scale));
  const titleFontSize = Math.max(11, Math.round(legend.labels.fontSize * scale));
  const swatchSize = Math.round(12 * scale);
  const padding = Math.round(10 * scale);
  const rowGap = Math.round(6 * scale);
  const swatchGap = Math.round(8 * scale);
  const titleGap = Math.round(8 * scale);
  const margin = Math.round(16 * scale);

  // Measure text widths
  ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`;
  const itemLabels = legendItems.map((item) => item.name);
  const allLabels = [...itemLabels, 'No Data'];
  const maxTextWidth = Math.max(...allLabels.map((l) => ctx.measureText(l).width));

  // Calculate legend dimensions
  const boxWidth = padding * 2 + swatchSize + swatchGap + maxTextWidth;
  const totalRows = legendItems.length + 1; // +1 for No Data
  let boxHeight = padding * 2 + totalRows * (swatchSize + rowGap) - rowGap;
  if (legend.title.show) {
    boxHeight += titleFontSize + titleGap;
  }

  const isFloating = legend.position === 'floating' && legend.floatingPosition;
  const boxX = isFloating
    ? (legend.floatingPosition!.x / LEGEND_REFERENCE_SIZE) * canvas.width
    : margin;
  const boxY = isFloating
    ? (legend.floatingPosition!.y / LEGEND_REFERENCE_SIZE) * canvas.height
    : canvas.height - boxHeight - margin;

  // Background with rounded corners
  ctx.fillStyle = legend.backgroundColor;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6 * scale);
  ctx.fill();

  let cursorY = boxY + padding;

  // Title
  if (legend.title.show) {
    ctx.font = `600 ${titleFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = legend.labels.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(legend.title.text, boxX + padding, cursorY + titleFontSize / 2);
    cursorY += titleFontSize + titleGap;
  }

  // Legend items
  ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const drawRow = (color: string, label: string, hasBorder: boolean): void => {
    // Color swatch
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(boxX + padding, cursorY, swatchSize, swatchSize, 2 * scale);
    ctx.fill();
    if (hasBorder) {
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Label text
    ctx.fillStyle = legend.labels.color;
    ctx.fillText(label, boxX + padding + swatchSize + swatchGap, cursorY + swatchSize / 2);
    cursorY += swatchSize + rowGap;
  };

  for (const item of legendItems) {
    drawRow(item.color, item.name, false);
  }
  drawRow(noDataColor, 'No Data', true);

  ctx.restore();
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
  | 'legend'
  | 'legendPosition'
  | 'floatingPosition'
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
  const canvas = await svgToCanvas(svgString, scale);
  addLegend(canvas, options.legendItems, options.noDataColor, {
    ...options.legend,
    position: options.legendPosition,
    floatingPosition: options.floatingPosition,
  });
  addPeriodLabel(canvas, period);
  return canvas;
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
  const canvas = await svgToCanvas(svgString, scale);
  addLegend(canvas, options.legendItems, options.noDataColor, {
    ...options.legend,
    position: options.legendPosition,
    floatingPosition: options.floatingPosition,
  });
  addPeriodLabel(canvas, label);
  return canvas;
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
  const dataB = timelineData[timePeriods[spec.fromIndex + 1]];
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
  return renderFrameForSpec(rawSvg, timelineData, timePeriods, spec, scale, options);
};

/** Apply optional crop to a frame canvas. */
const maybeApplyCrop = (
  canvas: HTMLCanvasElement,
  crop: CropRect | undefined,
): HTMLCanvasElement => {
  if (!crop) return canvas;
  return cropCanvas(canvas, crop);
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
    sampleCanvases.push(maybeApplyCrop(raw, cropRect));
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
      : maybeApplyCrop(
          await renderFrameForSpec(rawSvg, timelineData, timePeriods, frameList[i], scale, options),
          cropRect,
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

  const firstCanvas = maybeApplyCrop(
    await renderFrameForSpec(rawSvg, timelineData, timePeriods, frameList[0], scale, options),
    cropRect,
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
        const canvas = maybeApplyCrop(
          await renderFrameForSpec(rawSvg, timelineData, timePeriods, frameList[i], scale, options),
          cropRect,
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
