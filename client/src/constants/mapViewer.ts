/** Fixed corner inset for the map watermark (export-aligned; same on right and bottom). */
export const MAP_WATERMARK_CORNER_INSET_PX = 12;

/**
 * Target for the "Made with Regionify" attribution badge shown on public embed pages.
 * `utm_*` lets us attribute embed-driven traffic in analytics.
 */
export const MADE_WITH_BADGE_HREF =
  'https://regionify.pro/?utm_source=embed&utm_medium=badge&utm_campaign=made_with_regionify';

/**
 * Extra `bottom` offset for the zoom control stack on the Observer badge tier when the watermark
 * sits inside the map frame (floating/hidden legend). With a bottom legend, the watermark
 * is laid out under the legend — no lift. (~12px inset + row height.)
 */
export const OBSERVER_BADGE_ZOOM_STACK_LIFT_PX = 24;

/**
 * Extra `bottom` offset for the zoom control stack when the `MadeWithRegionifyBadge` sits inside
 * the map frame (public embed, floating legend). Text-only row → small breathing room over the
 * attribution line.
 */
export const EMBED_BADGE_ZOOM_STACK_LIFT_PX = 20;
