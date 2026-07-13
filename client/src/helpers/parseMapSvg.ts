/**
 * Parse bundled amMap SVG strings for DOM styling.
 * Uses strict XML first, then HTML parser fallback (matches innerHTML leniency).
 */
export function normalizeMapSvgSource(svg: string): string {
  return svg
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/<\?xml[^?]*\?>\s*/i, '');
}

function getSvgRoot(doc: Document): SVGSVGElement | null {
  const queried = doc.querySelector('svg');
  if (queried) return queried;

  const root = doc.documentElement;
  if (root?.localName === 'svg') {
    return root as unknown as SVGSVGElement;
  }

  return null;
}

export function parseMapSvgElement(
  svg: string,
): { doc: Document; svgElement: SVGSVGElement } | null {
  if (typeof svg !== 'string') return null;

  const normalized = normalizeMapSvgSource(svg);
  if (!normalized.includes('<svg')) return null;

  const parser = new DOMParser();

  const xmlDoc = parser.parseFromString(normalized, 'image/svg+xml');
  if (!xmlDoc.querySelector('parsererror')) {
    const svgElement = getSvgRoot(xmlDoc);
    if (svgElement) return { doc: xmlDoc, svgElement };
  }

  const htmlDoc = parser.parseFromString(normalized, 'text/html');
  const htmlSvg = htmlDoc.body?.querySelector('svg');
  if (htmlSvg) return { doc: htmlDoc, svgElement: htmlSvg };

  return null;
}
