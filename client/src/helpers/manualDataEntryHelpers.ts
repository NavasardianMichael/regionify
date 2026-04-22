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

/** Whether manual entry should show the time column and save as timeline data. */
export const isTimelineManualEntryMode = (
  timelineData: Record<string, DataSet>,
  timePeriods: string[],
  historicalDataImport: boolean,
): boolean =>
  historicalDataImport && timePeriods.length > 0 && Object.keys(timelineData).length > 0;

/** Stable React/dnd key for a saved static row (one row per map region id). */
export const manualEntryRowKeyStatic = (regionId: string): string => `me:static:${regionId}`;

/** Stable key for a timeline row (region × time period). */
export const manualEntryRowKeyTimeline = (timePeriod: string, regionId: string): string =>
  `me:tl:${timePeriod}:${regionId}`;

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
        const exists = rows.some(
          (r) => r.id.trim() === id && (r.timePeriod ?? '').trim() === period.trim(),
        );
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

/**
 * True when the row’s id (and time period in timeline mode) matches the map’s expected slots.
 */
export function isManualEntryRowMatchedToExpected(
  row: DataRow,
  mapRegionIds: string[],
  timelineMode: boolean,
  timePeriods: string[],
): boolean {
  const id = row.id.trim();
  if (!id || !mapRegionIds.includes(id)) return false;

  if (timelineMode && timePeriods.length > 0) {
    const period = (row.timePeriod ?? '').trim();
    if (!period) return false;
    return timePeriods.some((p) => p.trim() === period);
  }

  return true;
}

/** After reordering filtered/sorted visible rows, merge back into the full row list. */
export function mergeVisibleRowReorder(
  allRows: DataRow[],
  nextVisibleOrdered: DataRow[],
): DataRow[] {
  const vis = new Set(nextVisibleOrdered.map((r) => r.key));
  const firstOriginalIndex = Math.min(
    ...allRows.map((r, i) => (vis.has(r.key) ? i : Number.POSITIVE_INFINITY)),
  );
  if (firstOriginalIndex === Number.POSITIVE_INFINITY) {
    return allRows;
  }
  const left = allRows.slice(0, firstOriginalIndex).filter((r) => !vis.has(r.key));
  const right = allRows.slice(firstOriginalIndex).filter((r) => !vis.has(r.key));
  return [...left, ...nextVisibleOrdered, ...right];
}

export function compareTimePeriodForSort(a: string | undefined, b: string | undefined): number {
  const sa = (a ?? '').trim();
  const sb = (b ?? '').trim();
  const na = Number(sa);
  const nb = Number(sb);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && sa !== '' && sb !== '') {
    return na - nb;
  }
  return sa.localeCompare(sb, undefined, { numeric: true });
}

/** True when two or more valid rows share the same region (and time period in timeline mode). */
export function hasDuplicateManualEntryRows(
  validRows: DataRow[],
  isTimelineMode: boolean,
): boolean {
  const seen = new Set<string>();
  if (isTimelineMode) {
    for (const r of validRows) {
      const key = `${(r.timePeriod ?? '').trim()}\0${r.id.trim()}`;
      if (seen.has(key)) return true;
      seen.add(key);
    }
  } else {
    for (const r of validRows) {
      const id = r.id.trim();
      if (seen.has(id)) return true;
      seen.add(id);
    }
  }
  return false;
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
        key: manualEntryRowKeyTimeline(period, r.id),
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
      key: manualEntryRowKeyStatic(storeId),
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
  if (isTimelineManualEntryMode(timelineData, timePeriods, historicalDataImport)) {
    const rows = rowsFromTimeline(timelineData, timePeriods);
    return rows.length > 0 ? rows : [createEmptyStaticRow()];
  }
  return rowsFromStaticData(storeData);
};

/**
 * Serialize current store data to a tab-delimited text string suitable for the
 * Tab Delimited Text modal textarea. Produces `id\tlabel\tvalue` rows for static
 * data or `id\tlabel\tvalue\ttime` rows for timeline data.
 */
export const serializeToTabDelimited = (
  storeData: LocalDataState,
  timelineData: Record<string, DataSet>,
  timePeriods: string[],
): string => {
  if (timePeriods.length > 0 && Object.keys(timelineData).length > 0) {
    const lines: string[] = ['id\tlabel\tvalue\ttime'];
    for (const period of timePeriods) {
      const ds = timelineData[period];
      if (!ds) continue;
      for (const id of ds.allIds) {
        const r = ds.byId[id];
        if (r) lines.push(`${r.id}\t${r.label}\t${r.value}\t${period}`);
      }
    }
    return lines.join('\n');
  }

  const lines: string[] = ['id\tlabel\tvalue'];
  for (const id of storeData.allIds) {
    const r = storeData.byId[id];
    if (r) lines.push(`${r.id}\t${r.label}\t${r.value}`);
  }
  return lines.join('\n');
};
