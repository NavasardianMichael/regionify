import { ExportType } from '../types/exportTypes.js';
import { Plan, PLANS } from '../types/plan.js';
import { EXPORT_TYPES } from './exportTypes.js';

/**
 * Feature limits per plan. Each plan includes all features of the previous one.
 * Free: PNG only, 50% quality. Explorer: all formats, 100%. Atlas: + historical data + animation.
 */
export type PlanDetails = {
  price: number; // Monthly price in USD (0 for free)
  limits: {
    maxExportQuality: number;
    /** Allowed export formats. Free = PNG only; explorer/atlas = PNG, SVG, JPEG. */
    allowedExportFormats: readonly ExportType[];
    /** Whether picture/export quality is limited (free only). */
    pictureQualityLimit: boolean;
    /** Max projects count (free = 5; explorer/atlas = unlimited). */
    maxProjectsCount: number | null;
    /** Advanced styles (explorer/atlas). */
    advancedStylesEnabled: boolean;
    /** Atlas only: import historical data (same format + time dimension). */
    historicalDataImport: boolean;
    /** Atlas only: generate animated GIF/video from historical data. */
    animationExport: boolean;
    /** Allowed animation export formats. Atlas only: GIF, MP4. */
    allowedAnimationFormats: readonly ExportType[];
  };
};

export const PLAN_DETAILS: Record<Plan, PlanDetails> = {
  [PLANS.observer]: {
    price: 0,
    limits: {
      maxExportQuality: 50,
      allowedExportFormats: [EXPORT_TYPES.png],
      allowedAnimationFormats: [],
      pictureQualityLimit: true,
      maxProjectsCount: 5,
      advancedStylesEnabled: false,
      historicalDataImport: false,
      animationExport: false,
    },
  },
  [PLANS.explorer]: {
    price: 59,
    limits: {
      maxExportQuality: 100,
      allowedExportFormats: [EXPORT_TYPES.png, EXPORT_TYPES.svg, EXPORT_TYPES.jpeg],
      allowedAnimationFormats: [],
      pictureQualityLimit: false,
      maxProjectsCount: null,
      advancedStylesEnabled: true,
      historicalDataImport: false,
      animationExport: false,
    },
  },
  [PLANS.chronographer]: {
    price: 159,
    limits: {
      maxExportQuality: 100,
      allowedExportFormats: [
        EXPORT_TYPES.png,
        EXPORT_TYPES.svg,
        EXPORT_TYPES.jpeg,
        EXPORT_TYPES.gif,
        EXPORT_TYPES.mp4,
      ],
      allowedAnimationFormats: [EXPORT_TYPES.gif, EXPORT_TYPES.mp4],
      pictureQualityLimit: false,
      maxProjectsCount: null,
      advancedStylesEnabled: true,
      historicalDataImport: true,
      animationExport: true,
    },
  },
};
