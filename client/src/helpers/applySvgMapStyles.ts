/**
 * Applies map styles (border, shadow, background, region labels, legend colors) to raw SVG.
 * Used by MapViewer for display. Pure function; no React or refs.
 */
import type { LegendItem } from '@/store/legendData/types';
import type { RegionData } from '@/store/mapData/types';
import type {
  BorderConfig,
  PictureConfig,
  RegionLabelsConfig,
  ShadowConfig,
} from '@/store/mapStyles/types';
import {
  CSS_STROKE_PROP_REGEX,
  CSS_STROKE_WIDTH_PROP_REGEX,
  SVG_PATH_COORD_REGEX,
  SVG_PATH_NUMBERS_REGEX,
} from '@/constants/svgPath';

export type ApplySvgMapStylesOptions = {
  border: BorderConfig;
  shadow: ShadowConfig;
  picture: PictureConfig;
  regionLabels: RegionLabelsConfig;
  data: { allIds: RegionData['id'][]; byId: Record<RegionData['id'], RegionData> };
  legendItems: LegendItem[];
  noDataColor: string;
  transitionType: 'instant' | 'smooth';
  labelPositions: Record<string, { x: number; y: number }>;
  pathClass: string;
  pathClassInstant: string;
};

function getPathBoundsFromD(
  d: string,
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const coordRegex = new RegExp(SVG_PATH_COORD_REGEX.source, 'gi');
  let match;
  let currentX = 0,
    currentY = 0;

  while ((match = coordRegex.exec(d)) !== null) {
    const command = match[1];
    const params = match[2].trim();
    const numbers = params.match(new RegExp(SVG_PATH_NUMBERS_REGEX.source, 'g'))?.map(Number) || [];
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

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return null;
  return { minX, minY, maxX, maxY };
}

function computeViewBoxFromPaths(paths: NodeListOf<SVGPathElement>): {
  viewBoxX: number;
  viewBoxY: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
} {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  paths.forEach((path) => {
    const d = path.getAttribute('d');
    if (!d) return;
    const bounds = getPathBoundsFromD(d);
    if (!bounds) return;
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  });

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return { viewBoxX: 0, viewBoxY: 0, viewBoxWidth: 0, viewBoxHeight: 0 };
  }

  const padding = 10;
  const viewBoxWidth = maxX - minX + padding * 2;
  const viewBoxHeight = maxY - minY + padding * 2;
  const viewBoxX = minX - padding;
  const viewBoxY = minY - padding;
  return { viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight };
}

export function applySvgMapStyles(svg: string, options: ApplySvgMapStylesOptions): string {
  const {
    border,
    shadow,
    picture,
    regionLabels,
    data,
    legendItems,
    noDataColor,
    transitionType,
    labelPositions,
    pathClass,
    pathClassInstant,
  } = options;

  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgElement = doc.querySelector('svg');

  if (!svgElement) return svg;

  const paths = svgElement.querySelectorAll('path');
  const { viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight } = computeViewBoxFromPaths(paths);

  if (viewBoxWidth > 0 && viewBoxHeight > 0) {
    svgElement.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
  }

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

  svgElement.removeAttribute('width');
  svgElement.removeAttribute('height');

  if (!svgElement.getAttribute('preserveAspectRatio')) {
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }

  const styleElement = svgElement.querySelector('style');
  if (styleElement) {
    let cssText = styleElement.textContent || '';
    if (border.show) {
      cssText = cssText.replace(CSS_STROKE_PROP_REGEX, `stroke: ${border.color};`);
      cssText = cssText.replace(CSS_STROKE_WIDTH_PROP_REGEX, `stroke-width: ${border.width};`);
    } else {
      cssText = cssText.replace(CSS_STROKE_PROP_REGEX, 'stroke: none;');
    }
    styleElement.textContent = cssText;
  }

  paths.forEach((path) => {
    path.classList.add(pathClass);
    if (transitionType === 'instant') {
      path.classList.add(pathClassInstant);
    }

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
        const matchingLegendItem = legendItems.find(
          (item) => regionData.value >= item.min && regionData.value <= item.max,
        );
        path.style.fill = matchingLegendItem ? matchingLegendItem.color : noDataColor;
      } else {
        path.style.fill = noDataColor;
      }
    }
  });

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
    pathsToMove.forEach((path) => g.appendChild(path));
    svgElement.appendChild(g);
  }

  if (regionLabels.show && data.allIds.length > 0) {
    const existingLabelsGroup = svgElement.querySelector('#regionLabelsGroup');
    if (existingLabelsGroup) existingLabelsGroup.remove();

    const labelsGroup = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelsGroup.setAttribute('id', 'regionLabelsGroup');

    paths.forEach((path) => {
      const pathTitle = path.getAttribute('title');
      if (!pathTitle) return;

      const regionData = data.byId[pathTitle];
      if (!regionData) return;

      const storedPos = labelPositions[pathTitle];
      let labelX: number;
      let labelY: number;

      if (storedPos) {
        labelX = storedPos.x;
        labelY = storedPos.y;
      } else {
        const d = path.getAttribute('d');
        if (!d) return;

        const bounds = getPathBoundsFromD(d);
        if (!bounds) return;

        labelX = (bounds.minX + bounds.maxX) / 2;
        labelY = (bounds.minY + bounds.maxY) / 2;
      }

      const text = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(labelX));
      text.setAttribute('y', String(labelY));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', regionLabels.color);
      text.setAttribute('font-size', String(regionLabels.fontSize));
      text.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      text.setAttribute('data-region-id', pathTitle);
      text.setAttribute('cursor', 'move');
      text.textContent = regionData.label;

      labelsGroup.appendChild(text);
    });

    svgElement.appendChild(labelsGroup);
  }

  return new XMLSerializer().serializeToString(doc);
}
