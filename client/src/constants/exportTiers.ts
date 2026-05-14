export type ResolutionTier = '720p' | '1080p' | '2k' | '4k';

export const RESOLUTION_TIERS: { value: ResolutionTier; label: string; height: number }[] = [
  { value: '720p', label: '720p', height: 720 },
  { value: '1080p', label: '1080p', height: 1080 },
  { value: '2k', label: '2K', height: 2160 },
  { value: '4k', label: '4K', height: 4320 },
];

export const HIGH_RES_TIER_MIN_HEIGHT = 2160;
