/**
 * Helper functions for managing temporary project state in localStorage.
 * Only changed (partial) data is stored; on restore it is merged with default initial data.
 */

import type { LegendDataState } from '@/store/legendData/types';
import type { LegendStylesState } from '@/store/legendStyles/types';
import type { VisualizerState } from '@/store/mapData/types';
import type { MapStylesState } from '@/store/mapStyles/types';
import { IMPORT_DATA_TYPES } from '@/constants/data';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';
import { DEFAULT_MAP_PICTURE } from '@/constants/mapStyles';

const TEMP_PROJECT_STATE_KEY = 'regionify-temp-project-state';
const RETURN_URL_KEY = 'regionify-return-url';
const SKIP_NEW_PROJECT_RESET_KEY = 'regionify-skip-new-project-reset-once';

/** Max age for guest / pre-login visualizer snapshots (1 hour since last persist). */
export const GUEST_PROJECT_SNAPSHOT_MAX_AGE_MS = 60 * 60 * 1000;

export type GuestProjectSnapshotEnvelope = {
  updatedAt: number;
  partial: TemporaryProjectState;
};

function isGuestSnapshotEnvelope(value: unknown): value is GuestProjectSnapshotEnvelope {
  if (value === null || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.updatedAt === 'number' && o.partial !== undefined && typeof o.partial === 'object'
  );
}

export type TemporaryProjectState = Partial<
  Pick<
    VisualizerState,
    | 'selectedCountryId'
    | 'importDataType'
    | 'data'
    | 'google'
    | 'timelineData'
    | 'timePeriods'
    | 'activeTimePeriod'
  > &
    Pick<
      MapStylesState,
      'border' | 'shadow' | 'zoomControls' | 'picture' | 'regionLabels' | 'timePeriodLabelOffset'
    > &
    Pick<
      LegendStylesState,
      | 'labels'
      | 'title'
      | 'position'
      | 'floatingPosition'
      | 'floatingSize'
      | 'transparentBackground'
      | 'backgroundColor'
      | 'noDataColor'
    > &
    Pick<LegendDataState, 'items'>
>;

/** Full default state used when merging partial stored state. */
export type FullTemporaryProjectState = Required<TemporaryProjectState>;

const EMPTY_DATA = {
  allIds: [] as string[],
  byId: {} as Record<string, { id: string; label: string; value: number }>,
};

function getDefaultTemporaryProjectState(): FullTemporaryProjectState {
  return {
    selectedCountryId: null,
    importDataType: IMPORT_DATA_TYPES.csv,
    data: EMPTY_DATA,
    google: { url: null, gid: null },
    timelineData: {},
    timePeriods: [],
    activeTimePeriod: null,
    border: {
      show: true,
      color: '#FFFFFF',
      width: 1,
    },
    shadow: {
      show: false,
      color: '#000000',
      blur: 10,
      offsetX: 0,
      offsetY: 4,
    },
    zoomControls: {
      show: true,
      position: { x: 20, y: 20 },
    },
    picture: { ...DEFAULT_MAP_PICTURE },
    regionLabels: {
      show: false,
      color: '#333333',
      fontSize: 10,
      labelPositionsByRegionId: {},
    },
    timePeriodLabelOffset: { x: 0, y: 0 },
    labels: {
      color: '#18294D',
      fontSize: 12,
    },
    title: {
      show: true,
      text: 'INTENSITY RATIO',
    },
    position: LEGEND_POSITIONS.floating,
    floatingPosition: { x: 20, y: 20 },
    floatingSize: { width: 160, height: 'auto' },
    transparentBackground: false,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    noDataColor: '#E5E7EB',
    items: { allIds: [], byId: {} },
  };
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') return false;
  const keysA = Object.keys(a) as (keyof typeof a)[];
  const keysB = new Set(Object.keys(b));
  if (keysA.length !== keysB.size) return false;
  return keysA.every(
    (key) =>
      keysB.has(key as string) &&
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

/**
 * Build partial state containing only keys that differ from default (for minimal localStorage).
 */
export function buildPartialTemporaryState(
  current: FullTemporaryProjectState,
): TemporaryProjectState {
  const defaults = getDefaultTemporaryProjectState();
  const partial: TemporaryProjectState = {};
  const keys = Object.keys(defaults) as (keyof FullTemporaryProjectState)[];
  for (const key of keys) {
    if (!deepEqual(current[key], defaults[key])) {
      (partial as Record<string, unknown>)[key] = current[key];
    }
  }
  return partial;
}

/**
 * Merge stored partial state with defaults. Call when restoring after login.
 * Nested objects (e.g. border, data) are merged so partial overrides only provided fields.
 */
export function mergeTemporaryStateWithDefaults(
  partial: TemporaryProjectState | null,
): FullTemporaryProjectState {
  const defaults = getDefaultTemporaryProjectState();
  if (!partial || Object.keys(partial).length === 0) return defaults;
  const merged = { ...defaults };
  const keys = Object.keys(partial) as (keyof TemporaryProjectState)[];
  for (const key of keys) {
    const p = partial[key];
    if (p === undefined) continue;
    const d = defaults[key];
    if (
      p != null &&
      d != null &&
      typeof p === 'object' &&
      typeof d === 'object' &&
      !Array.isArray(p) &&
      !Array.isArray(d)
    ) {
      (merged as Record<string, unknown>)[key] = { ...(d as object), ...(p as object) };
    } else {
      (merged as Record<string, unknown>)[key] = p;
    }
  }
  return merged as FullTemporaryProjectState;
}

/**
 * Read raw envelope from localStorage (migrates legacy flat partial shape once).
 */
export function readGuestProjectSnapshotEnvelope(): GuestProjectSnapshotEnvelope | null {
  try {
    const stored = localStorage.getItem(TEMP_PROJECT_STATE_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (isGuestSnapshotEnvelope(parsed)) {
      return parsed;
    }
    if (parsed !== null && typeof parsed === 'object' && !('updatedAt' in parsed)) {
      saveTemporaryProjectState(parsed as TemporaryProjectState);
      const migrated = localStorage.getItem(TEMP_PROJECT_STATE_KEY);
      if (!migrated) return null;
      const again: unknown = JSON.parse(migrated);
      return isGuestSnapshotEnvelope(again) ? again : null;
    }
    return null;
  } catch (error) {
    console.error('Failed to read guest project snapshot:', error);
    return null;
  }
}

export function isGuestSnapshotExpired(envelope: GuestProjectSnapshotEnvelope): boolean {
  return Date.now() - envelope.updatedAt > GUEST_PROJECT_SNAPSHOT_MAX_AGE_MS;
}

/**
 * Save temporary project state to localStorage (partial + timestamp for TTL).
 */
export function saveTemporaryProjectState(state: TemporaryProjectState): void {
  try {
    const envelope: GuestProjectSnapshotEnvelope = { updatedAt: Date.now(), partial: state };
    localStorage.setItem(TEMP_PROJECT_STATE_KEY, JSON.stringify(envelope));
  } catch (error) {
    console.error('Failed to save temporary project state:', error);
  }
}

/**
 * Get temporary project state if still valid (not expired). Clears storage when expired.
 */
export function getTemporaryProjectState(): TemporaryProjectState | null {
  const envelope = readGuestProjectSnapshotEnvelope();
  if (!envelope) return null;
  if (isGuestSnapshotExpired(envelope)) {
    clearTemporaryProjectState();
    return null;
  }
  return envelope.partial;
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

/** After login/OAuth restore, skip wiping stores on the next `/projects/new` layout effect. */
export function setSkipNewProjectResetOnce(): void {
  try {
    sessionStorage.setItem(SKIP_NEW_PROJECT_RESET_KEY, '1');
  } catch (error) {
    console.error('Failed to set skip new project reset flag:', error);
  }
}

export function consumeSkipNewProjectResetOnce(): boolean {
  try {
    const v = sessionStorage.getItem(SKIP_NEW_PROJECT_RESET_KEY);
    if (v === '1') {
      sessionStorage.removeItem(SKIP_NEW_PROJECT_RESET_KEY);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to read skip new project reset flag:', error);
    return false;
  }
}
