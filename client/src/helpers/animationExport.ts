import { applyPalette, GIFEncoder, quantize } from 'gifenc';
import type { LegendItem } from '@/store/legendData/types';
import type { LegendLabelsConfig, LegendTitleConfig } from '@/store/legendStyles/types';
import type { DataSet } from '@/store/mapData/types';
import type { BorderConfig, PictureConfig, ShadowConfig } from '@/store/mapStyles/types';
import { renderStyledSvg } from './svgRenderer';

type LegendConfig = {
  title: LegendTitleConfig;
  labels: LegendLabelsConfig;
  backgroundColor: string;
};

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
  fps: number;
  /** Frames generated between each pair of time periods for smooth color transitions. */
  framesPerTransition?: number;
  onProgress?: (progress: number) => void;
};

const DEFAULT_FRAMES_PER_TRANSITION = 24;

/** Total frame count for smooth animation (for UI duration estimate). */
export const getAnimationTotalFrames = (
  timePeriodCount: number,
  framesPerTransition: number = DEFAULT_FRAMES_PER_TRANSITION,
): number => {
  if (timePeriodCount <= 1) return Math.max(1, timePeriodCount);
  return (timePeriodCount - 1) * Math.max(2, framesPerTransition);
};

/** Quality (1–100) maps to a canvas scale multiplier. */
const qualityToScale = (quality: number): number => Math.max(0.5, quality / 25);

/** Parse hex color to [r, g, b] (0–255). */
const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace(/^#/, ''), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
};

/** Linear interpolation between two RGB tuples. t in [0, 1]. */
const lerpRgb = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

/** Format RGB to hex. */
const rgbToHex = (r: number, g: number, b: number): string =>
  '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');

/** Interpolate between two hex colors. t in [0, 1]. */
const lerpColor = (colorA: string, colorB: string, t: number): string => {
  const rgb = lerpRgb(hexToRgb(colorA), hexToRgb(colorB), t);
  return rgbToHex(rgb[0], rgb[1], rgb[2]);
};

/** Resolve region color from data and legend. */
const getColorForRegion = (
  data: DataSet,
  regionId: string,
  legendItems: LegendItem[],
  noDataColor: string,
): string => {
  const regionData = data.byId[regionId];
  if (!regionData) return noDataColor;
  const item = legendItems.find((i) => regionData.value >= i.min && regionData.value <= i.max);
  return item ? item.color : noDataColor;
};

/** Build per-region color map by interpolating between two data sets. t in [0, 1]. */
const getInterpolatedColorMap = (
  dataA: DataSet,
  dataB: DataSet,
  t: number,
  legendItems: LegendItem[],
  noDataColor: string,
): Record<string, string> => {
  const regionIds = new Set([...dataA.allIds, ...dataB.allIds]);
  const map: Record<string, string> = {};
  for (const id of regionIds) {
    const colorA = getColorForRegion(dataA, id, legendItems, noDataColor);
    const colorB = getColorForRegion(dataB, id, legendItems, noDataColor);
    map[id] = lerpColor(colorA, colorB, t);
  }
  return map;
};

type FrameSpec = {
  periodIndex: number;
  t: number;
  label: string;
};

/** Build list of frame specs for smooth transitions between time periods. */
const buildFrameList = (timePeriods: string[], framesPerTransition: number): FrameSpec[] => {
  const list: FrameSpec[] = [];
  if (timePeriods.length === 0) return list;
  if (timePeriods.length === 1) {
    list.push({ periodIndex: 0, t: 1, label: timePeriods[0] });
    return list;
  }
  for (let i = 0; i < timePeriods.length - 1; i++) {
    const steps = Math.max(2, framesPerTransition);
    for (let k = 0; k < steps; k++) {
      const t = k / (steps - 1);
      const label = t >= 0.5 ? timePeriods[i + 1] : timePeriods[i];
      list.push({ periodIndex: i, t, label });
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

/** Draws the legend box overlay in the bottom-left corner of the canvas. */
const addLegend = (
  canvas: HTMLCanvasElement,
  legendItems: LegendItem[],
  noDataColor: string,
  legend: LegendConfig,
): void => {
  if (legendItems.length === 0) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();

  const scale = Math.max(1, canvas.width / 800);
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

  // Position: bottom-left corner with margin
  const boxX = margin;
  const boxY = canvas.height - boxHeight - margin;

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
  'legendItems' | 'noDataColor' | 'border' | 'shadow' | 'picture' | 'legend'
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
  });
  const canvas = await svgToCanvas(svgString, scale);
  addLegend(canvas, options.legendItems, options.noDataColor, options.legend);
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
  });
  const canvas = await svgToCanvas(svgString, scale);
  addLegend(canvas, options.legendItems, options.noDataColor, options.legend);
  addPeriodLabel(canvas, label);
  return canvas;
};

/** Render the frame for a given FrameSpec (interpolated or keyframe). */
const renderFrameForSpec = async (
  rawSvg: string,
  timelineData: Record<string, DataSet>,
  timePeriods: string[],
  spec: FrameSpec,
  scale: number,
  options: FrameOptions,
): Promise<HTMLCanvasElement> => {
  if (spec.t === 1 && spec.periodIndex === timePeriods.length - 1) {
    return renderFrame(
      rawSvg,
      timelineData[timePeriods[spec.periodIndex]],
      spec.label,
      scale,
      options,
    );
  }
  if (spec.t === 0 && spec.periodIndex === 0) {
    return renderFrame(rawSvg, timelineData[timePeriods[0]], spec.label, scale, options);
  }
  const dataA = timelineData[timePeriods[spec.periodIndex]];
  const dataB = timelineData[timePeriods[spec.periodIndex + 1]];
  return renderInterpolatedFrame(rawSvg, dataA, dataB, spec.t, spec.label, scale, options);
};

/** Export animation as GIF using gifenc with smooth color transitions and stable global palette. */
export const exportAnimationAsGif = async (options: AnimationExportOptions): Promise<void> => {
  const {
    rawSvg,
    timePeriods,
    timelineData,
    quality,
    fps,
    framesPerTransition = DEFAULT_FRAMES_PER_TRANSITION,
    onProgress,
  } = options;

  const scale = qualityToScale(quality);
  const delay = Math.round(1000 / fps);
  const frameList = buildFrameList(timePeriods, framesPerTransition);
  const totalFrames = frameList.length;

  if (totalFrames === 0) return;

  const sampleIndices = [0, Math.floor(totalFrames / 2), totalFrames - 1].filter(
    (a, i, arr) => arr.indexOf(a) === i,
  );

  const sampleCanvases: HTMLCanvasElement[] = [];
  for (let i = 0; i < sampleIndices.length; i++) {
    const canvas = await renderFrameForSpec(
      rawSvg,
      timelineData,
      timePeriods,
      frameList[sampleIndices[i]],
      scale,
      options,
    );
    sampleCanvases.push(canvas);
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
    const canvas = sampleIndexSet.has(i)
      ? sampleCanvases[sampleIndices.indexOf(i)]
      : await renderFrameForSpec(rawSvg, timelineData, timePeriods, frameList[i], scale, options);
    const ctx = canvas.getContext('2d');
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
    framesPerTransition = DEFAULT_FRAMES_PER_TRANSITION,
    onProgress,
  } = options;

  const scale = qualityToScale(quality);
  const frameList = buildFrameList(timePeriods, framesPerTransition);
  const totalFrames = frameList.length;
  const frameDurationMs = 1000 / fps;

  if (totalFrames === 0) return;

  const firstCanvas = await renderFrameForSpec(
    rawSvg,
    timelineData,
    timePeriods,
    frameList[0],
    scale,
    options,
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
        const canvas = await renderFrameForSpec(
          rawSvg,
          timelineData,
          timePeriods,
          frameList[i],
          scale,
          options,
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
