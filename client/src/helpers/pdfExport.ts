import jsPDF from 'jspdf';
import type { DataSet } from '@/store/mapData/types';
import { type FrameOptions, renderFrame } from '@/helpers/animationExport';
import {
  drawWatermark,
  generateMapCanvas,
  generateMapCanvasFallback,
  type StillExportOpts,
} from '@/helpers/mapExport';

export type PdfPageFormat = 'a4' | 'a3' | 'letter' | 'legal';
export type PdfOrientation = 'portrait' | 'landscape';

const makePdf = (format: PdfPageFormat, orientation: PdfOrientation): jsPDF =>
  new jsPDF({ orientation, unit: 'mm', format });

/** Scales image to fill one page dimension, centers on the other — no distortion. */
const fitImageToPage = (
  imgWidthPx: number,
  imgHeightPx: number,
  pdf: jsPDF,
): { x: number; y: number; width: number; height: number } => {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgAspect = imgWidthPx / imgHeightPx;
  const pageAspect = pageW / pageH;
  let width: number, height: number;
  if (imgAspect > pageAspect) {
    width = pageW;
    height = pageW / imgAspect;
  } else {
    height = pageH;
    width = pageH * imgAspect;
  }
  return { x: (pageW - width) / 2, y: (pageH - height) / 2, width, height };
};

/**
 * Composites the source canvas onto a white background before PNG encoding.
 * Removes the alpha channel so jsPDF embeds a simpler RGB PNG (no viewer-dependent
 * alpha handling) and anti-aliased region edges blend consistently against white paper.
 */
const toPdfPngDataUrl = (source: HTMLCanvasElement): string => {
  const out = document.createElement('canvas');
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext('2d');
  if (!ctx) return source.toDataURL('image/png');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(source, 0, 0);
  return out.toDataURL('image/png');
};

export type SinglePagePdfOptions = {
  quality: number;
  fileName?: string;
  stillOpts?: StillExportOpts;
  pageFormat?: PdfPageFormat;
  orientation?: PdfOrientation;
};

export const exportMapAsSinglePagePdf = async ({
  quality,
  fileName = 'regionify-map',
  stillOpts,
  pageFormat = 'a4',
  orientation = 'portrait',
}: SinglePagePdfOptions): Promise<void> => {
  const { watermark, ...cleanOpts } = stillOpts ?? {};

  let canvas = await generateMapCanvas(quality, 'png', cleanOpts);
  if (!canvas) canvas = await generateMapCanvasFallback(quality, 'png', cleanOpts);
  if (!canvas) throw new Error('Failed to generate canvas for PDF export');

  if (watermark) {
    const ctx = canvas.getContext('2d');
    if (ctx) await drawWatermark(ctx, canvas.width, canvas.height, watermark);
  }

  const pdf = makePdf(pageFormat, orientation);
  const { x, y, width, height } = fitImageToPage(canvas.width, canvas.height, pdf);
  pdf.addImage(toPdfPngDataUrl(canvas), 'PNG', x, y, width, height);
  pdf.save(`${fileName}.pdf`);
};

export type MultiPagePdfOptions = {
  rawSvg: string;
  timePeriods: string[];
  timelineData: Record<string, DataSet>;
  quality: number;
  fileName?: string;
  frameOptions: FrameOptions;
  watermark?: StillExportOpts['watermark'];
  onProgress?: (progress: number) => void;
  pageFormat?: PdfPageFormat;
  orientation?: PdfOrientation;
};

export const exportMapAsMultiPagePdf = async ({
  rawSvg,
  timePeriods,
  timelineData,
  quality,
  fileName = 'regionify-map',
  frameOptions,
  watermark,
  onProgress,
  pageFormat = 'a4',
  orientation = 'portrait',
}: MultiPagePdfOptions): Promise<void> => {
  if (timePeriods.length === 0) throw new Error('No time periods to export');

  const scale = Math.max(0.5, quality / 25);
  let pdf: jsPDF | null = null;

  for (let i = 0; i < timePeriods.length; i++) {
    const period = timePeriods[i];
    const data = timelineData[period];
    if (!data) continue;

    const frameCanvas = await renderFrame(rawSvg, data, period, scale, frameOptions);

    if (watermark) {
      const ctx = frameCanvas.getContext('2d');
      if (ctx) await drawWatermark(ctx, frameCanvas.width, frameCanvas.height, watermark);
    }

    if (!pdf) {
      pdf = makePdf(pageFormat, orientation);
    } else {
      pdf.addPage(pageFormat as string, orientation);
    }

    const { x, y, width, height } = fitImageToPage(frameCanvas.width, frameCanvas.height, pdf);
    pdf.addImage(toPdfPngDataUrl(frameCanvas), 'PNG', x, y, width, height);
    onProgress?.((i + 1) / timePeriods.length);
  }

  if (!pdf) throw new Error('Failed to generate PDF pages');
  pdf.save(`${fileName}.pdf`);
};
