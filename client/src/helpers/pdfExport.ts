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

/**
 * Renders the map canvas, background fill, and watermark onto a single full-page canvas.
 * The map is centered (letterboxed), the watermark is anchored to the page bottom — not
 * the map image bottom — so it stays consistent regardless of aspect-ratio margins.
 */
const compositePageCanvas = async (
  mapCanvas: HTMLCanvasElement,
  pdf: jsPDF,
  opts: {
    backgroundColor?: string;
    watermark?: StillExportOpts['watermark'];
  },
): Promise<HTMLCanvasElement> => {
  const MM_TO_PX = 144 / 25.4; // 144 DPI
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const pxW = Math.round(pageW * MM_TO_PX);
  const pxH = Math.round(pageH * MM_TO_PX);

  const out = document.createElement('canvas');
  out.width = pxW;
  out.height = pxH;
  const ctx = out.getContext('2d');
  if (!ctx) return mapCanvas;

  ctx.fillStyle = opts.backgroundColor ?? '#ffffff';
  ctx.fillRect(0, 0, pxW, pxH);

  const imgAspect = mapCanvas.width / mapCanvas.height;
  const pageAspect = pxW / pxH;
  let drawW: number, drawH: number;
  if (imgAspect > pageAspect) {
    drawW = pxW;
    drawH = pxW / imgAspect;
  } else {
    drawH = pxH;
    drawW = pxH * imgAspect;
  }
  const drawX = Math.round((pxW - drawW) / 2);
  const drawY = Math.round((pxH - drawH) / 2);
  ctx.drawImage(mapCanvas, drawX, drawY, drawW, drawH);

  if (opts.watermark) {
    await drawWatermark(ctx, pxW, pxH, opts.watermark);
  }

  return out;
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

  const pdf = makePdf(pageFormat, orientation);
  const pageCanvas = await compositePageCanvas(canvas, pdf, {
    backgroundColor: cleanOpts?.backgroundColor,
    watermark,
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, pageH);
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
  backgroundColor?: string;
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
  backgroundColor,
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

    if (!pdf) {
      pdf = makePdf(pageFormat, orientation);
    } else {
      pdf.addPage(pageFormat as string, orientation);
    }

    const pageCanvas = await compositePageCanvas(frameCanvas, pdf, { backgroundColor, watermark });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, pageH);
    onProgress?.((i + 1) / timePeriods.length);
  }

  if (!pdf) throw new Error('Failed to generate PDF pages');
  pdf.save(`${fileName}.pdf`);
};
