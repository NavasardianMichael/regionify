/** Fixed corner inset for the map watermark (export-aligned; same on right and bottom). */
export const MAP_WATERMARK_CORNER_INSET_PX = 12;

/**
 * Extra `bottom` offset for the zoom control stack on the Observer badge tier when the watermark
 * sits inside the map frame (floating/hidden legend). With a bottom legend, the watermark
 * is laid out under the legend — no lift. (~12px inset + row height.)
 */
export const OBSERVER_BADGE_ZOOM_STACK_LIFT_PX = 24;
