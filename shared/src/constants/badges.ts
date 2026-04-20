import { ExportType } from '../types/exportTypes.js';
import { Badge, BADGES } from '../types/badge.js';
import { EXPORT_TYPES } from './exportTypes.js';

/**
 * Feature limits per badge (tier). Each tier includes the previous tier’s capabilities.
 * Observer: JPEG only (capped quality), project cap. Explorer+: PNG, SVG, JPEG; full quality; advanced styles.
 * Chronographer: time-series, GIF/MP4 animation export, public embed.
 */
export type BadgeDetails = {
  price: number; // Monthly price in USD (0 for free)
  limits: {
    maxExportQuality: number;
    /** Allowed export formats (still + animated, by tier). */
    allowedExportFormats: readonly ExportType[];
    /** Whether picture/export quality is limited (Observer only). */
    pictureQualityLimit: boolean;
    /** Max projects count (Observer = 5; paid = unlimited). */
    maxProjectsCount: number | null;
    /** Max simultaneous active sessions per account (null = unlimited). */
    maxConcurrentSessions: number | null;
    /** Advanced map/legend styling (Explorer+). */
    advancedStylesEnabled: boolean;
    /** Time-series import & timeline (Chronographer). */
    historicalDataImport: boolean;
    /** Animated timeline export (Chronographer). */
    animationExport: boolean;
    /** Formats allowed for animation export (Chronographer: GIF, MP4). */
    allowedAnimationFormats: readonly ExportType[];
    /** Chronographer: public embed URL / iframe for a project map. */
    publicEmbed: boolean;
  };
};

export const BADGE_DETAILS: Record<Badge, BadgeDetails> = {
  [BADGES.observer]: {
    price: 0,
    limits: {
      maxExportQuality: 100,
      allowedExportFormats: [EXPORT_TYPES.png, EXPORT_TYPES.jpeg, EXPORT_TYPES.pdf],
      allowedAnimationFormats: [],
      pictureQualityLimit: false,
      maxProjectsCount: 5,
      maxConcurrentSessions: 5,
      advancedStylesEnabled: false,
      historicalDataImport: false,
      animationExport: false,
      publicEmbed: false,
    },
  },
  [BADGES.explorer]: {
    price: 49,
    limits: {
      maxExportQuality: 100,
      allowedExportFormats: [
        EXPORT_TYPES.png,
        EXPORT_TYPES.svg,
        EXPORT_TYPES.jpeg,
        EXPORT_TYPES.pdf,
      ],
      allowedAnimationFormats: [],
      pictureQualityLimit: false,
      maxProjectsCount: null,
      maxConcurrentSessions: 5,
      advancedStylesEnabled: true,
      historicalDataImport: false,
      animationExport: false,
      publicEmbed: true,
    },
  },
  [BADGES.chronographer]: {
    price: 149,
    limits: {
      maxExportQuality: 100,
      allowedExportFormats: [
        EXPORT_TYPES.png,
        EXPORT_TYPES.svg,
        EXPORT_TYPES.jpeg,
        EXPORT_TYPES.gif,
        EXPORT_TYPES.mp4,
        EXPORT_TYPES.pdf,
      ],
      allowedAnimationFormats: [EXPORT_TYPES.gif, EXPORT_TYPES.mp4],
      pictureQualityLimit: false,
      maxProjectsCount: null,
      maxConcurrentSessions: 5,
      advancedStylesEnabled: true,
      historicalDataImport: true,
      animationExport: true,
      publicEmbed: true,
    },
  },
};
