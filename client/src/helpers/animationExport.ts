import { GIFEncoder, applyPalette, quantize } from 'gifenc';

import type { LegendItem } from '@/store/legendData/types';
import type { DataSet } from '@/store/mapData/types';
import type { BorderConfig, PictureConfig, ShadowConfig } from '@/store/mapStyles/types';

import { renderStyledSvg } from './svgRenderer';

type AnimationExportOptions = {
  rawSvg: string;
  timePeriods: string[];
  timelineData: Record<string, DataSet>;
  legendItems: LegendItem[];
  noDataColor: string;
  border: BorderConfig;
  shadow: ShadowConfig;
  picture: PictureConfig;
  quality: number;
  fps: number;
  onProgress?: (progress: number) => void;
};

/** Quality (1–100) maps to a canvas scale multiplier. */
const qualityToScale = (quality: number): number => Math.max(0.5, quality / 25);

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

/** Render a single frame canvas for the given time period. */
const renderFrame = async (
  rawSvg: string,
  data: DataSet,
  period: string,
  scale: number,
  options: Pick<
    AnimationExportOptions,
    'legendItems' | 'noDataColor' | 'border' | 'shadow' | 'picture'
  >,
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
  addPeriodLabel(canvas, period);
  return canvas;
};

/** Export animation as GIF using gifenc. */
export const exportAnimationAsGif = async (options: AnimationExportOptions): Promise<void> => {
  const { rawSvg, timePeriods, timelineData, quality, fps, onProgress } = options;

  const scale = qualityToScale(quality);
  const delay = Math.round(1000 / fps);
  const totalFrames = timePeriods.length;

  // Render first frame to get dimensions
  const firstCanvas = await renderFrame(
    rawSvg,
    timelineData[timePeriods[0]],
    timePeriods[0],
    scale,
    options,
  );
  const { width, height } = firstCanvas;

  const gif = GIFEncoder();

  for (let i = 0; i < totalFrames; i++) {
    const period = timePeriods[i];
    const canvas =
      i === 0
        ? firstCanvas
        : await renderFrame(rawSvg, timelineData[period], period, scale, options);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    const imageData = ctx.getImageData(0, 0, width, height);
    const palette = quantize(imageData.data, 256);
    const index = applyPalette(imageData.data, palette);
    gif.writeFrame(index, width, height, { palette, delay });

    onProgress?.((i + 1) / totalFrames);
  }

  gif.finish();
  const bytes = gif.bytes();
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'image/gif' });
  triggerDownload(blob, 'regionify-animation.gif');
};

/** Export animation as MP4/WebM video using MediaRecorder. */
export const exportAnimationAsVideo = async (options: AnimationExportOptions): Promise<void> => {
  const { rawSvg, timePeriods, timelineData, quality, fps, onProgress } = options;

  const scale = qualityToScale(quality);
  const totalFrames = timePeriods.length;
  const frameDuration = 1000 / fps;

  // Render first frame to get dimensions
  const firstCanvas = await renderFrame(
    rawSvg,
    timelineData[timePeriods[0]],
    timePeriods[0],
    scale,
    options,
  );
  const { width, height } = firstCanvas;

  // Recording canvas
  const recordCanvas = document.createElement('canvas');
  recordCanvas.width = width;
  recordCanvas.height = height;
  const recordCtx = recordCanvas.getContext('2d');
  if (!recordCtx) throw new Error('Failed to get recording canvas context');

  // Best available video codec
  const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
    ? 'video/mp4;codecs=avc1'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

  const isMP4 = mimeType.startsWith('video/mp4');
  const extension = isMP4 ? 'mp4' : 'webm';
  const baseMime = mimeType.split(';')[0];

  const stream = recordCanvas.captureStream(0);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
  });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e: BlobEvent) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const videoBlob = await new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('Recording failed'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: baseMime }));

    recorder.start();

    const renderFrames = async (): Promise<void> => {
      for (let i = 0; i < totalFrames; i++) {
        const period = timePeriods[i];
        const canvas =
          i === 0
            ? firstCanvas
            : await renderFrame(rawSvg, timelineData[period], period, scale, options);

        recordCtx.clearRect(0, 0, width, height);
        recordCtx.drawImage(canvas, 0, 0);

        // Request frame capture on the video track
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && 'requestFrame' in videoTrack) {
          (videoTrack as unknown as { requestFrame: () => void }).requestFrame();
        }

        onProgress?.((i + 1) / totalFrames);
        await new Promise<void>((r) => setTimeout(r, frameDuration));
      }

      recorder.stop();
    };

    renderFrames().catch(reject);
  });

  triggerDownload(videoBlob, `regionify-animation.${extension}`);
};
