/**
 * Helper functions for managing temporary project state in localStorage.
 * Used when user needs to login before saving/exporting.
 */

import type { DataSet } from '@/store/mapData/types';
import type { MapStylesState } from '@/store/mapStyles/types';
import type { LegendStylesState } from '@/store/legendStyles/types';
import type { LegendItem } from '@/store/legendData/types';
import type { ImportDataType, RegionId } from '@/types/mapData';

const TEMP_PROJECT_STATE_KEY = 'regionify-temp-project-state';
const RETURN_URL_KEY = 'regionify-return-url';

export type TemporaryProjectState = {
  selectedRegionId: RegionId | null;
  dataset: {
    allIds: string[];
    byId: Record<string, unknown>;
    importDataType: ImportDataType;
  } | null;
  mapStyles: MapStylesState;
  legendStyles: LegendStylesState;
  legendData: {
    items: LegendItem[];
  };
};

/**
 * Save temporary project state to localStorage
 */
export function saveTemporaryProjectState(state: TemporaryProjectState): void {
  try {
    localStorage.setItem(TEMP_PROJECT_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save temporary project state:', error);
  }
}

/**
 * Get temporary project state from localStorage
 */
export function getTemporaryProjectState(): TemporaryProjectState | null {
  try {
    const stored = localStorage.getItem(TEMP_PROJECT_STATE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as TemporaryProjectState;
  } catch (error) {
    console.error('Failed to get temporary project state:', error);
    return null;
  }
}

/**
 * Clear temporary project state from localStorage
 */
export function clearTemporaryProjectState(): void {
  try {
    localStorage.removeItem(TEMP_PROJECT_STATE_KEY);
  } catch (error) {
    console.error('Failed to clear temporary project state:', error);
  }
}

/**
 * Save return URL to localStorage
 */
export function saveReturnUrl(url: string): void {
  try {
    localStorage.setItem(RETURN_URL_KEY, url);
  } catch (error) {
    console.error('Failed to save return URL:', error);
  }
}

/**
 * Get return URL from localStorage
 */
export function getReturnUrl(): string | null {
  try {
    return localStorage.getItem(RETURN_URL_KEY);
  } catch (error) {
    console.error('Failed to get return URL:', error);
    return null;
  }
}

/**
 * Clear return URL from localStorage
 */
export function clearReturnUrl(): void {
  try {
    localStorage.removeItem(RETURN_URL_KEY);
  } catch (error) {
    console.error('Failed to clear return URL:', error);
  }
}
