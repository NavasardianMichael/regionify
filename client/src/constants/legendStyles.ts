export const LEGEND_POSITIONS = {
  floating: 'floating',
  bottom: 'bottom',
  hidden: 'hidden',
} as const;

/** Default legend panel fill when not transparent (matches initial store). */
export const DEFAULT_LEGEND_BACKGROUND_COLOR = 'rgba(255, 255, 255, 0.95)';

/** Solid color string for the color picker when the legend uses an opaque background. */
export function resolveOpaqueLegendBackgroundColor(styles: { backgroundColor: string }): string {
  return styles.backgroundColor || DEFAULT_LEGEND_BACKGROUND_COLOR;
}
