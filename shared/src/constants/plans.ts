import { ExportType } from '../types/exportTypes.js';
import { Plan } from '../types/plan.js';
import { EXPORT_TYPES } from './exportTypes.js';

/**
 * Feature limits per plan. Each plan includes all features of the previous one.
 * Free: PNG only, 50% quality. Explorer: all formats, 100%. Atlas: + historical data + animation.
 */
export type PlanFeatureLimits = {
  /** Max export quality (1–100). Free = 50; explorer/atlas = 100. */
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
};

export const PLAN_FEATURE_LIMITS: Record<Plan, PlanFeatureLimits> = {
  free: {
    maxExportQuality: 50,
    allowedExportFormats: [EXPORT_TYPES.png],
    pictureQualityLimit: true,
    maxProjectsCount: 5,
    advancedStylesEnabled: false,
    historicalDataImport: false,
    animationExport: false,
  },
  explorer: {
    maxExportQuality: 100,
    allowedExportFormats: [EXPORT_TYPES.png, EXPORT_TYPES.svg, EXPORT_TYPES.jpeg],
    pictureQualityLimit: false,
    maxProjectsCount: null,
    advancedStylesEnabled: true,
    historicalDataImport: false,
    animationExport: false,
  },
  atlas: {
    maxExportQuality: 100,
    allowedExportFormats: [EXPORT_TYPES.png, EXPORT_TYPES.svg, EXPORT_TYPES.jpeg],
    pictureQualityLimit: false,
    maxProjectsCount: null,
    advancedStylesEnabled: true,
    historicalDataImport: true,
    animationExport: true,
  },
};
