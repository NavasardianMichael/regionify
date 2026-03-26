import type { LegendItem } from '@/store/legendData/types';
import type { DataSet, RegionData } from '@/store/mapData/types';

/** Hermite smoothstep: zero derivative at 0 and 1 so blends ease out of A and into B. */
export const smoothstep01 = (t: number): number => {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
};

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace(/^#/, ''), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
};

const rgbToHex = (r: number, g: number, b: number): string =>
  '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');

const lerpRgb = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

const lerpColor = (colorA: string, colorB: string, t: number): string => {
  const rgb = lerpRgb(hexToRgb(colorA), hexToRgb(colorB), t);
  return rgbToHex(rgb[0], rgb[1], rgb[2]);
};

const getColorForRegion = (
  data: DataSet,
  regionId: string,
  legendItems: LegendItem[],
  noDataColor: string,
): string => {
  const regionData: RegionData | undefined = data.byId[regionId];
  if (!regionData || regionData.hidden) return noDataColor;
  const item = legendItems.find((i) => regionData.value >= i.min && regionData.value <= i.max);
  return item ? item.color : noDataColor;
};

/** Per-path hex fill colors by interpolating legend colors between two datasets. t in [0, 1]. */
export const getInterpolatedColorMap = (
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
