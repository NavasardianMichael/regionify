/** Map legend item index to a palette stop (even distribution across ranges). */
export function samplePaletteColor(palette: string[], index: number, total: number): string {
  if (palette.length === 0) return '#6B7280';
  if (total <= 1) return palette[palette.length - 1];
  const ratio = index / (total - 1);
  const paletteIndex = Math.round(ratio * (palette.length - 1));
  return palette[paletteIndex] ?? palette[palette.length - 1];
}
