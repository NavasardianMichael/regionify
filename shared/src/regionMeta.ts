import { REGION_OPTIONS } from './constants/regions.js';

const ENGLISH_LABEL_BY_REGION_ID: ReadonlyMap<string, string> = new Map(
  REGION_OPTIONS.map((o) => [o.value, o.label]),
);

/**
 * English label for a visualizer region id (same as REGION_OPTIONS labels).
 * Used for embed SSR meta tags when resolving `project.countryId`.
 */
export function getRegionEnglishLabelForMeta(regionId: string | null | undefined): string | null {
  if (!regionId) return null;
  return ENGLISH_LABEL_BY_REGION_ID.get(regionId) ?? null;
}
