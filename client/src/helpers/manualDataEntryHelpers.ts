import type { DataSet, VisualizerState } from '@/store/mapData/types';
import { generateRandomId } from '@/helpers/common';

export type LocalDataState = VisualizerState['data'];

/** One row in the manual data entry table. timePeriod set when editing timeline data. */
export type DataRow = {
  key: string;
  id: string;
  label: string;
  value: number;
  timePeriod?: string;
  hidden?: boolean;
};

export type MissingDataSlot =
  | { kind: 'static'; id: string }
  | { kind: 'timeline'; id: string; timePeriod: string };

export const createEmptyStaticRow = (): DataRow => ({
  key: generateRandomId(),
  id: '',
  label: '',
  value: 0,
});

/** First map region (× period in timeline mode) with no matching row; deterministic order. */
export function findFirstMissingDataSlot(
  rows: DataRow[],
  mapRegionIds: string[],
  timelineMode: boolean,
  timePeriods: string[],
): MissingDataSlot | null {
  if (mapRegionIds.length === 0) return null;

  if (timelineMode && timePeriods.length > 0) {
    for (const period of timePeriods) {
      for (const id of mapRegionIds) {
        const exists = rows.some((r) => r.id === id && r.timePeriod === period);
        if (!exists) return { kind: 'timeline', id, timePeriod: period };
      }
    }
    return null;
  }

  for (const id of mapRegionIds) {
    const exists = rows.some((r) => r.id.trim() === id);
    if (!exists) return { kind: 'static', id };
  }
  return null;
}

/** Flatten timeline data into rows (ID, Label, Time, Value) for display/editing. */
export const rowsFromTimeline = (
  timelineData: Record<string, DataSet>,
  timePeriods: string[],
): DataRow[] => {
  const rows: DataRow[] = [];
  for (const period of timePeriods) {
    const data = timelineData[period];
    if (!data) continue;
    for (const regionId of data.allIds) {
      const r = data.byId[regionId];
      if (!r) continue;
      rows.push({
        key: generateRandomId(),
        id: r.id,
        label: r.label,
        value: r.value,
        timePeriod: period,
        ...(r.hidden ? { hidden: true } : {}),
      });
    }
  }
  return rows;
};

/** Build rows from static data (no time column). */
export const rowsFromStaticData = (storeData: LocalDataState): DataRow[] => {
  if (storeData.allIds.length === 0) {
    return [createEmptyStaticRow()];
  }
  return storeData.allIds.map((storeId) => {
    const r = storeData.byId[storeId];
    return {
      key: generateRandomId(),
      id: r.id,
      label: r.label,
      value: r.value,
      ...(r.hidden ? { hidden: true } : {}),
    };
  });
};

/** Build initial rows when modal opens: use timeline if present and plan allows, else static data. */
export const buildInitialRows = (
  storeData: LocalDataState,
  timelineData: Record<string, DataSet>,
  timePeriods: string[],
  historicalDataImport: boolean,
): DataRow[] => {
  const hasTimeline =
    historicalDataImport && timePeriods.length > 0 && Object.keys(timelineData).length > 0;
  if (hasTimeline) {
    const rows = rowsFromTimeline(timelineData, timePeriods);
    return rows.length > 0 ? rows : [createEmptyStaticRow()];
  }
  return rowsFromStaticData(storeData);
};
