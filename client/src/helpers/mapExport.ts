import { EXPORT_TYPES } from '@regionify/shared';

const MAP_SVG_SELECTOR = '.map-svg-container svg';
const DEFAULT_EXPORT_NAME = 'regionify-map';

const getMapSvgElement = (): SVGSVGElement => {
  const el = document.querySelector<SVGSVGElement>(MAP_SVG_SELECTOR);
  if (!el) throw new Error('Map SVG element not found');
  return el;
};

/**
 * Clones the SVG and prepares it for standalone export
 * by setting namespaces and explicit dimensions from the viewBox.
 */
const prepareSvgForExport = (svgElement: SVGSVGElement): SVGSVGElement => {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const viewBox = clone.getAttribute('viewBox');
  if (viewBox) {
    const [, , width, height] = viewBox.split(/\s+/).map(Number);
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));
  }

  return clone;
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

const canvasToBlob = (
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

export const exportMapAsSvg = (fileName = DEFAULT_EXPORT_NAME): void => {
  const clone = prepareSvgForExport(getMapSvgElement());
  const svgString = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgString], { type: `image/${EXPORT_TYPES.svg}+xml;charset=utf-8` });
  triggerDownload(blob, `${fileName}.${EXPORT_TYPES.svg}`);
};

export const exportMapAsPng = async (
  quality: number,
  fileName = DEFAULT_EXPORT_NAME,
  opts?: { backgroundColor?: string; watermark?: string },
): Promise<void> => {
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
    ctx.save();
    ctx.font = 'bold 18px Montserrat, Arial, sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.globalAlpha = 0.7;
    ctx.fillText(opts.watermark, canvas.width - 12, canvas.height - 12);
    ctx.restore();
  }
  const blob = await canvasToBlob(canvas, `image/${EXPORT_TYPES.png}`);
  triggerDownload(blob, `${fileName}.${EXPORT_TYPES.png}`);
};

export const exportMapAsJpeg = async (
  quality: number,
  fileName = DEFAULT_EXPORT_NAME,
  opts?: { backgroundColor?: string; watermark?: string },
): Promise<void> => {
  const clone = prepareSvgForExport(getMapSvgElement());
  const svgString = new XMLSerializer().serializeToString(clone);
  const canvas = await svgToCanvas(svgString, qualityToScale(quality));

  // JPEG doesn't support transparency — fill with background color
  const jpegCanvas = document.createElement('canvas');
  jpegCanvas.width = canvas.width;
  jpegCanvas.height = canvas.height;

  const ctx = jpegCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create JPEG canvas context');

  ctx.fillStyle = opts?.backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
  ctx.drawImage(canvas, 0, 0);
  if (opts?.watermark) {
    ctx.save();
    ctx.font = 'bold 18px Montserrat, Arial, sans-serif';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.globalAlpha = 0.7;
    ctx.fillText(opts.watermark, jpegCanvas.width - 12, jpegCanvas.height - 12);
    ctx.restore();
  }
  const blob = await canvasToBlob(jpegCanvas, `image/${EXPORT_TYPES.jpeg}`, 0.92);
  triggerDownload(blob, `${fileName}.${EXPORT_TYPES.jpeg}`);
};
