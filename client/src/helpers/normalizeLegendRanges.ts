import { useLegendDataStore } from '@/store/legendData/store';
import type { LegendItem } from '@/store/legendData/types';
import { useVisualizerStore } from '@/store/mapData/store';
import type { DataSet } from '@/store/mapData/types';

function collectNumericValues(data: DataSet, timelineData: Record<string, DataSet>): number[] {
  const values: number[] = [];
  for (const id of data.allIds) {
    const v = data.byId[id]?.value;
    if (typeof v === 'number' && !Number.isNaN(v)) values.push(v);
  }
  for (const periodKey of Object.keys(timelineData)) {
    const ds = timelineData[periodKey];
    if (!ds) continue;
    for (const id of ds.allIds) {
      const v = ds.byId[id]?.value;
      if (typeof v === 'number' && !Number.isNaN(v)) values.push(v);
    }
  }
  return values;
}

/** Evenly redistributes legend items between min and max, keeping names/colors. */
function distributeRanges(legendItems: LegendItem[], min: number, max: number): LegendItem[] {
  const count = legendItems.length;
  const step = (max - min) / count;
  return legendItems.map((item, index) => ({
    ...item,
    min: Number((min + step * index).toFixed(2)),
    max: Number((min + step * (index + 1)).toFixed(2)),
  }));
}

/** Computes normalized legend items, or null when there's no numeric data or no legend ranges. */
function computeNormalizedLegendItems(): LegendItem[] | null {
  const { data, timelineData } = useVisualizerStore.getState();
  const { items } = useLegendDataStore.getState();
  const legendItems = items.allIds.map((id) => items.byId[id]);

  const values = collectNumericValues(data, timelineData);
  if (values.length === 0 || legendItems.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  return distributeRanges(legendItems, min, max);
}

/** True when there's numeric data and at least one legend range to normalize. */
export function canNormalizeLegendRanges(): boolean {
  return computeNormalizedLegendItems() !== null;
}

/**
 * Evenly redistributes current legend ranges between the dataset's min and max value.
 * Returns false (no-op) when there's no numeric data or no legend ranges.
 */
export function normalizeLegendRanges(): boolean {
  const normalized = computeNormalizedLegendItems();
  if (!normalized) return false;
  useLegendDataStore.getState().setItems(normalized);
  return true;
}
