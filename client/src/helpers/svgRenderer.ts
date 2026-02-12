import type { LegendItem } from '@/store/legendData/types';
import type { RegionData } from '@/store/mapData/types';
import type { BorderConfig, PictureConfig, ShadowConfig } from '@/store/mapStyles/types';

type RenderStyledSvgOptions = {
  rawSvg: string;
  data: {
    allIds: RegionData['id'][];
    byId: Record<RegionData['id'], RegionData>;
  };
  legendItems: LegendItem[];
  noDataColor: string;
  border: BorderConfig;
  shadow: ShadowConfig;
  picture: PictureConfig;
};

/**
 * Computes the bounding box of all SVG paths by parsing path `d` attributes.
 */
function computePathBounds(paths: NodeListOf<SVGPathElement>): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  paths.forEach((path) => {
    const d = path.getAttribute('d');
    if (!d) return;

    const coordRegex = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi;
    let match;
    let currentX = 0;
    let currentY = 0;

    while ((match = coordRegex.exec(d)) !== null) {
      const command = match[1];
      const params = match[2].trim();
      const numbers = params.match(/[-+]?[0-9]*\.?[0-9]+/g)?.map(Number) || [];
      const isRelative = command === command.toLowerCase();
      const cmd = command.toUpperCase();

      if (cmd === 'M' || cmd === 'L' || cmd === 'T') {
        for (let i = 0; i < numbers.length; i += 2) {
          const x = isRelative ? currentX + numbers[i] : numbers[i];
          const y = isRelative ? currentY + (numbers[i + 1] ?? 0) : (numbers[i + 1] ?? 0);
          currentX = x;
          currentY = y;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      } else if (cmd === 'H') {
        for (const num of numbers) {
          const x = isRelative ? currentX + num : num;
          currentX = x;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
        }
      } else if (cmd === 'V') {
        for (const num of numbers) {
          const y = isRelative ? currentY + num : num;
          currentY = y;
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      } else if (cmd === 'C') {
        for (let i = 0; i < numbers.length; i += 6) {
          for (let j = 0; j < 6; j += 2) {
            const x = isRelative ? currentX + numbers[i + j] : numbers[i + j];
            const y = isRelative ? currentY + (numbers[i + j + 1] ?? 0) : (numbers[i + j + 1] ?? 0);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
          currentX = isRelative ? currentX + numbers[i + 4] : numbers[i + 4];
          currentY = isRelative ? currentY + (numbers[i + 5] ?? 0) : (numbers[i + 5] ?? 0);
        }
      } else if (cmd === 'S' || cmd === 'Q') {
        const step = 4;
        for (let i = 0; i < numbers.length; i += step) {
          for (let j = 0; j < step; j += 2) {
            const x = isRelative ? currentX + numbers[i + j] : numbers[i + j];
            const y = isRelative ? currentY + (numbers[i + j + 1] ?? 0) : (numbers[i + j + 1] ?? 0);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
          currentX = isRelative ? currentX + numbers[i + step - 2] : numbers[i + step - 2];
          currentY = isRelative
            ? currentY + (numbers[i + step - 1] ?? 0)
            : (numbers[i + step - 1] ?? 0);
        }
      }
    }
  });

  return { minX, minY, maxX, maxY };
}

/**
 * Renders a styled SVG string from raw SVG content and visualization config.
 * Used for animation frame export — does not include region labels or CSS classes.
 */
export function renderStyledSvg({
  rawSvg,
  data,
  legendItems,
  noDataColor,
  border,
  shadow,
  picture,
}: RenderStyledSvgOptions): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
  const svgElement = doc.querySelector('svg');

  if (!svgElement) return rawSvg;

  const paths = svgElement.querySelectorAll('path');
  const { minX, minY, maxX, maxY } = computePathBounds(paths);

  let viewBoxX = 0;
  let viewBoxY = 0;
  let viewBoxWidth = 0;
  let viewBoxHeight = 0;

  if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
    // Account for shadow offset/blur and border width in padding
    const shadowPadding = shadow.show
      ? Math.max(shadow.blur, Math.abs(shadow.offsetX), Math.abs(shadow.offsetY)) + shadow.blur
      : 0;
    const borderPadding = border.show ? border.width : 0;
    const padding = Math.max(10, shadowPadding + borderPadding + 5);

    viewBoxWidth = maxX - minX + padding * 2;
    viewBoxHeight = maxY - minY + padding * 2;
    viewBoxX = minX - padding;
    viewBoxY = minY - padding;
    svgElement.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
  }

  // Background
  if (!picture.transparentBackground && viewBoxWidth > 0 && viewBoxHeight > 0) {
    const existingBg = svgElement.querySelector('#mapBackground');
    if (existingBg) existingBg.remove();

    const bgRect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('id', 'mapBackground');
    bgRect.setAttribute('x', String(viewBoxX));
    bgRect.setAttribute('y', String(viewBoxY));
    bgRect.setAttribute('width', String(viewBoxWidth));
    bgRect.setAttribute('height', String(viewBoxHeight));
    bgRect.setAttribute('fill', picture.backgroundColor);
    svgElement.insertBefore(bgRect, svgElement.firstChild);
  }

  // Set explicit dimensions so the Image element sizes correctly for canvas export
  if (viewBoxWidth > 0 && viewBoxHeight > 0) {
    svgElement.setAttribute('width', String(viewBoxWidth));
    svgElement.setAttribute('height', String(viewBoxHeight));
  } else {
    svgElement.removeAttribute('width');
    svgElement.removeAttribute('height');
  }

  if (!svgElement.getAttribute('preserveAspectRatio')) {
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }

  // Update embedded <style> with border config
  const styleElement = svgElement.querySelector('style');
  if (styleElement) {
    let cssText = styleElement.textContent || '';
    if (border.show) {
      cssText = cssText.replace(/stroke\s*:\s*[^;]+;/g, `stroke: ${border.color};`);
      cssText = cssText.replace(/stroke-width\s*:\s*[^;]+;/g, `stroke-width: ${border.width};`);
    } else {
      cssText = cssText.replace(/stroke\s*:\s*[^;]+;/g, 'stroke: none;');
    }
    styleElement.textContent = cssText;
  }

  // Apply inline styles to paths (no CSS classes for export)
  paths.forEach((path) => {
    path.style.fillOpacity = '1';
    path.style.strokeOpacity = '1';

    if (border.show) {
      path.style.stroke = border.color;
      path.style.strokeWidth = String(border.width);
    } else {
      path.style.stroke = 'none';
    }

    const pathTitle = path.getAttribute('title');
    if (pathTitle) {
      const regionData = data.byId[pathTitle];
      if (regionData) {
        const matchingItem = legendItems.find(
          (item) => regionData.value >= item.min && regionData.value <= item.max,
        );
        path.style.fill = matchingItem ? matchingItem.color : noDataColor;
      } else {
        path.style.fill = noDataColor;
      }
    }
  });

  // Shadow
  if (shadow.show) {
    const existingFilter = svgElement.querySelector('#mapShadow');
    if (existingFilter) existingFilter.remove();

    const defs =
      svgElement.querySelector('defs') || doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
    if (!svgElement.querySelector('defs')) {
      svgElement.insertBefore(defs, svgElement.firstChild);
    }

    const filter = doc.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'mapShadow');
    // Expand filter region to prevent shadow clipping
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%');
    filter.setAttribute('height', '140%');
    filter.innerHTML = `
      <feDropShadow 
        dx="${shadow.offsetX}" 
        dy="${shadow.offsetY}" 
        stdDeviation="${shadow.blur / 2}" 
        flood-color="${shadow.color}"
        flood-opacity="0.3"
      />
    `;
    defs.appendChild(filter);

    const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('filter', 'url(#mapShadow)');
    const pathsToMove = Array.from(svgElement.querySelectorAll('g > path, svg > path'));
    pathsToMove.forEach((p) => g.appendChild(p));
    svgElement.appendChild(g);
  }

  return new XMLSerializer().serializeToString(doc);
}
