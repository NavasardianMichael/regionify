import { EXPORT_TYPES } from '@regionify/shared';
import type { LegendItem } from '@/store/legendData/types';
import type { LegendLabelsConfig, LegendTitleConfig } from '@/store/legendStyles/types';

const MAP_SVG_SELECTOR = '.map-svg-container svg';
const MAP_EXPORT_ROOT = '[data-map-export-root]';
const DEFAULT_EXPORT_NAME = 'regionify-map';
const DEFAULT_WATERMARK_LOGO_SRC = '/favicon-32x32.png';

export type MapExportLegendDrawOptions = {
  title: LegendTitleConfig;
  labels: LegendLabelsConfig;
  items: LegendItem[];
  noDataColor: string;
  backgroundColor: string;
};

export type MapExportWatermarkOptions = {
  text: string;
  showTrademark?: boolean;
  /** Omit or undefined: use default favicon. `null`: text only. */
  logoSrc?: string | null;
};

export type StillExportOpts = {
  backgroundColor?: string;
  watermark?: string | MapExportWatermarkOptions;
  /** Draw legend in export to match on-screen layout when legend markers exist. */
  legendDraw?: MapExportLegendDrawOptions | null;
};

const getMapSvgElement = (): SVGSVGElement => {
  const el = document.querySelector<SVGSVGElement>(MAP_SVG_SELECTOR);
  if (!el) throw new Error('Map SVG element not found');
  return el;
};

/**
 * Clones the SVG and prepares it for standalone export
 * by setting namespaces and explicit dimensions from the viewBox
 * or optional CSS-pixel width/height (for raster matching on-screen size).
 */
const prepareSvgForExport = (
  svgElement: SVGSVGElement,
  exportCssWidth?: number,
  exportCssHeight?: number,
): SVGSVGElement => {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const useExplicitSize =
    exportCssWidth != null &&
    exportCssHeight != null &&
    Number.isFinite(exportCssWidth) &&
    Number.isFinite(exportCssHeight) &&
    exportCssWidth > 0 &&
    exportCssHeight > 0;

  if (useExplicitSize) {
    clone.setAttribute('width', String(Math.round(exportCssWidth)));
    clone.setAttribute('height', String(Math.round(exportCssHeight)));
  } else {
    const viewBox = clone.getAttribute('viewBox');
    if (viewBox) {
      const [, , width, height] = viewBox.split(/\s+/).map(Number);
      clone.setAttribute('width', String(width));
      clone.setAttribute('height', String(height));
    }
  }

  return clone;
};

export const triggerDownload = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const loadRasterForCanvas = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

const normalizeWatermark = (
  watermark: string | MapExportWatermarkOptions,
): { text: string; showTrademark: boolean; logoSrc: string | null } => {
  if (typeof watermark === 'string') {
    return {
      text: watermark,
      showTrademark: false,
      logoSrc: DEFAULT_WATERMARK_LOGO_SRC,
    };
  }
  return {
    text: watermark.text,
    showTrademark: watermark.showTrademark ?? false,
    logoSrc: watermark.logoSrc === undefined ? DEFAULT_WATERMARK_LOGO_SRC : watermark.logoSrc,
  };
};

/**
 * Light gray corner watermark: optional logo, brand text, optional ™.
 */
export const drawWatermark = async (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  watermark: string | MapExportWatermarkOptions,
): Promise<void> => {
  const { text, showTrademark, logoSrc } = normalizeWatermark(watermark);
  const line = showTrademark ? `${text}\u2122` : text;

  const pad = Math.max(10, Math.round(Math.min(width, height) * 0.014));
  const fontSize = Math.max(13, Math.round(Math.min(width, height) * 0.024));

  let logo: HTMLImageElement | null = null;
  if (logoSrc) {
    logo = await loadRasterForCanvas(logoSrc);
  }

  ctx.save();
  ctx.globalAlpha = 0.76;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.font = `400 ${fontSize}px Montserrat, Arial, sans-serif`;
  ctx.fillStyle = 'rgb(180, 180, 180)';

  const textWidth = ctx.measureText(line).width;
  const logoGap = Math.round(fontSize * 0.4);
  const logoDrawSize = logo ? Math.round(fontSize * 1.35) : 0;

  const textX = width - pad;
  const baselineY = height - pad;

  if (logo && logoDrawSize > 0) {
    const logoX = textX - textWidth - logoGap - logoDrawSize;
    const logoY = baselineY - logoDrawSize;
    ctx.drawImage(logo, logoX, logoY, logoDrawSize, logoDrawSize);
  }

  ctx.fillText(line, textX, baselineY);
  ctx.restore();
};

/**
 * Renders a serialized SVG string onto a canvas at the given scale.
 */
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

export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Failed to generate ${mimeType} blob`));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
};

/**
 * Quality (1–100) maps to a canvas scale multiplier.
 * 25 → 1×, 50 → 2×, 100 → 4×. Minimum is clamped to 0.5×.
 */
const qualityToScale = (quality: number): number => Math.max(0.5, quality / 25);

const drawRoundedRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void => {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
};

const drawLegendOnCanvas = (
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; w: number; h: number },
  legend: MapExportLegendDrawOptions,
  scale: number,
): void => {
  const { x, y, w, h } = bounds;
  const pad = Math.round(8 * scale);
  const radius = Math.round(8 * scale);
  const swatch = Math.round(12 * scale);
  const fontSize = Math.round(legend.labels.fontSize * scale);
  const swatchTextGap = Math.round(8 * scale);
  const rowGap = Math.round(8 * scale);
  const titleGap = Math.round(12 * scale);

  ctx.save();
  ctx.beginPath();
  drawRoundedRectPath(ctx, x, y, w, h, radius);
  ctx.clip();

  ctx.beginPath();
  drawRoundedRectPath(ctx, x, y, w, h, radius);
  ctx.fillStyle = legend.backgroundColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(24, 41, 77, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  let cy = y + pad + Math.round(2 * scale);
  ctx.textAlign = 'left';

  if (legend.title.show && legend.title.text.trim()) {
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = legend.labels.color;
    ctx.textBaseline = 'top';
    ctx.fillText(legend.title.text, x + pad, cy);
    cy += fontSize + titleGap;
  }

  ctx.textBaseline = 'middle';

  for (const item of legend.items) {
    ctx.fillStyle = item.color;
    ctx.fillRect(x + pad, cy - swatch / 2, swatch, swatch);
    ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = legend.labels.color;
    ctx.fillText(item.name, x + pad + swatch + swatchTextGap, cy);
    cy += Math.max(swatch, fontSize) + rowGap;
  }

  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + pad, cy - swatch / 2, swatch, swatch);
  ctx.fillStyle = legend.noDataColor;
  ctx.fillRect(x + pad + 0.5, cy - swatch / 2 + 0.5, swatch - 1, swatch - 1);
  ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = legend.labels.color;
  ctx.fillText('No Data', x + pad + swatch + swatchTextGap, cy);

  ctx.restore();
};

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Crops a canvas to the given rectangle. Returns a new canvas with the cropped area. */
export const cropCanvas = (source: HTMLCanvasElement, crop: CropRect): HTMLCanvasElement => {
  const cropped = document.createElement('canvas');
  cropped.width = Math.round(crop.width);
  cropped.height = Math.round(crop.height);
  const ctx = cropped.getContext('2d');
  if (!ctx) throw new Error('Failed to get crop canvas context');
  ctx.drawImage(
    source,
    Math.round(crop.x),
    Math.round(crop.y),
    Math.round(crop.width),
    Math.round(crop.height),
    0,
    0,
    Math.round(crop.width),
    Math.round(crop.height),
  );
  return cropped;
};

/**
 * Generates the map canvas at export quality using the composite DOM layout.
 * Returns the canvas if successful, or null if the export root is unavailable.
 */
export const generateMapCanvas = async (
  quality: number,
  format: 'png' | 'jpeg',
  opts?: StillExportOpts,
): Promise<HTMLCanvasElement | null> => {
  const root = document.querySelector<HTMLElement>(MAP_EXPORT_ROOT);
  if (!root) return null;

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  const svgEl = root.querySelector<SVGSVGElement>(MAP_SVG_SELECTOR);
  if (!svgEl) return null;

  const qs = qualityToScale(quality);
  const rootRect = root.getBoundingClientRect();
  const w = Math.max(1, Math.round(rootRect.width * qs));
  const h = Math.max(1, Math.round(rootRect.height * qs));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  if (format === 'jpeg') {
    ctx.fillStyle = opts?.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, w, h);
  } else if (opts?.backgroundColor) {
    ctx.fillStyle = opts.backgroundColor;
    ctx.fillRect(0, 0, w, h);
  }

  const svgRect = svgEl.getBoundingClientRect();
  const sw = Math.max(1, Math.round(svgRect.width * qs));
  const sh = Math.max(1, Math.round(svgRect.height * qs));
  const sx = (svgRect.left - rootRect.left) * qs;
  const sy = (svgRect.top - rootRect.top) * qs;

  const clone = prepareSvgForExport(svgEl, sw, sh);
  const svgString = new XMLSerializer().serializeToString(clone);
  const mapCanvas = await svgToCanvas(svgString, 1);
  ctx.drawImage(mapCanvas, sx, sy);

  const legendEl =
    root.querySelector<HTMLElement>('[data-map-export-floating-legend]') ??
    root.querySelector<HTMLElement>('[data-map-export-bottom-legend]');
  if (legendEl && opts?.legendDraw && opts.legendDraw.items.length > 0) {
    const lr = legendEl.getBoundingClientRect();
    const lx = (lr.left - rootRect.left) * qs;
    const ly = (lr.top - rootRect.top) * qs;
    const lw = Math.max(1, lr.width * qs);
    const lh = Math.max(1, lr.height * qs);
    drawLegendOnCanvas(ctx, { x: lx, y: ly, w: lw, h: lh }, opts.legendDraw, qs);
  }

  if (opts?.watermark) {
    await drawWatermark(ctx, w, h, opts.watermark);
  }

  return canvas;
};

/**
 * Fallback canvas generation when the composite DOM root is not available.
 * Renders from the SVG element directly (no legend/layout matching).
 */
export const generateMapCanvasFallback = async (
  quality: number,
  format: 'png' | 'jpeg',
  opts?: StillExportOpts,
): Promise<HTMLCanvasElement> => {
  const clone = prepareSvgForExport(getMapSvgElement());
  const svgString = new XMLSerializer().serializeToString(clone);
  const canvas = await svgToCanvas(svgString, qualityToScale(quality));
  const ctx = canvas.getContext('2d');

  if (format === 'jpeg') {
    const jpegCanvas = document.createElement('canvas');
    jpegCanvas.width = canvas.width;
    jpegCanvas.height = canvas.height;
    const jpegCtx = jpegCanvas.getContext('2d');
    if (!jpegCtx) throw new Error('Failed to create JPEG canvas context');
    jpegCtx.fillStyle = opts?.backgroundColor || '#ffffff';
    jpegCtx.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
    jpegCtx.drawImage(canvas, 0, 0);
    if (opts?.watermark) {
      await drawWatermark(jpegCtx, jpegCanvas.width, jpegCanvas.height, opts.watermark);
    }
    return jpegCanvas;
  }

  if (ctx && opts?.backgroundColor) {
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = opts.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  }
  if (ctx && opts?.watermark) {
    await drawWatermark(ctx, canvas.width, canvas.height, opts.watermark);
  }
  return canvas;
};

/**
 * Exports map + optional legend using the same layout as the visualizer (zoom/pan/legend position).
 * @returns true if composite export ran, false if markers were missing (caller may fall back).
 */
const tryExportCompositeStill = async (
  quality: number,
  fileName: string,
  format: 'png' | 'jpeg',
  opts?: StillExportOpts,
): Promise<boolean> => {
  const canvas = await generateMapCanvas(quality, format, opts);
  if (!canvas) return false;

  if (format === 'png') {
    const blob = await canvasToBlob(canvas, `image/${EXPORT_TYPES.png}`);
    triggerDownload(blob, `${fileName}.${EXPORT_TYPES.png}`);
  } else {
    const blob = await canvasToBlob(canvas, `image/${EXPORT_TYPES.jpeg}`, 0.92);
    triggerDownload(blob, `${fileName}.${EXPORT_TYPES.jpeg}`);
  }

  return true;
};

export const exportMapAsSvg = (fileName = DEFAULT_EXPORT_NAME): void => {
  const clone = prepareSvgForExport(getMapSvgElement());
  const svgString = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgString], { type: `image/${EXPORT_TYPES.svg}+xml;charset=utf-8` });
  triggerDownload(blob, `${fileName}.${EXPORT_TYPES.svg}`);
};

export const exportMapAsPng = async (
  quality: number,
  fileName = DEFAULT_EXPORT_NAME,
  opts?: StillExportOpts,
): Promise<void> => {
  if (await tryExportCompositeStill(quality, fileName, 'png', opts)) {
    return;
  }

  const clone = prepareSvgForExport(getMapSvgElement());
  const svgString = new XMLSerializer().serializeToString(clone);
  const canvas = await svgToCanvas(svgString, qualityToScale(quality));
  const ctx = canvas.getContext('2d');
  if (ctx && opts?.backgroundColor) {
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = opts.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  }
  if (ctx && opts?.watermark) {
    await drawWatermark(ctx, canvas.width, canvas.height, opts.watermark);
  }
  const blob = await canvasToBlob(canvas, `image/${EXPORT_TYPES.png}`);
  triggerDownload(blob, `${fileName}.${EXPORT_TYPES.png}`);
};

export const exportMapAsJpeg = async (
  quality: number,
  fileName = DEFAULT_EXPORT_NAME,
  opts?: StillExportOpts,
): Promise<void> => {
  if (await tryExportCompositeStill(quality, fileName, 'jpeg', opts)) {
    return;
  }

  const clone = prepareSvgForExport(getMapSvgElement());
  const svgString = new XMLSerializer().serializeToString(clone);
  const canvas = await svgToCanvas(svgString, qualityToScale(quality));

  const jpegCanvas = document.createElement('canvas');
  jpegCanvas.width = canvas.width;
  jpegCanvas.height = canvas.height;

  const ctx = jpegCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create JPEG canvas context');

  ctx.fillStyle = opts?.backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
  ctx.drawImage(canvas, 0, 0);
  if (opts?.watermark) {
    await drawWatermark(ctx, jpegCanvas.width, jpegCanvas.height, opts.watermark);
  }
  const blob = await canvasToBlob(jpegCanvas, `image/${EXPORT_TYPES.jpeg}`, 0.92);
  triggerDownload(blob, `${fileName}.${EXPORT_TYPES.jpeg}`);
};
