/**
 * Regex and constants for parsing SVG path `d` attributes.
 * Used by map styling, export, and path bounds computation.
 */

/** Matches SVG path commands (M, L, H, V, C, S, Q, T, A, Z) and their parameter string. */
export const SVG_PATH_COORD_REGEX = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi;

/** Matches a single number (including optional sign and decimal) in path parameters. */
export const SVG_PATH_NUMBERS_REGEX = /[-+]?[0-9]*\.?[0-9]+/g;

/** Matches CSS stroke property in style blocks (for SVG style override). */
export const CSS_STROKE_PROP_REGEX = /stroke\s*:\s*[^;]+;/g;

/** Matches CSS stroke-width property in style blocks. */
export const CSS_STROKE_WIDTH_PROP_REGEX = /stroke-width\s*:\s*[^;]+;/g;
