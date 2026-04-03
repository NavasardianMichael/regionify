import type { DataRow } from '@/helpers/manualDataEntryHelpers';
import { compareTimePeriodForSort } from '@/helpers/manualDataEntryHelpers';

export type ColumnFilterKey = 'id' | 'label' | 'value' | 'time';

export type ColumnFilters = Record<ColumnFilterKey, string>;

export type MiddleColKey = Exclude<ColumnFilterKey, never>;

export function sortTableData(
  data: DataRow[],
  field: string | undefined,
  order: 'ascend' | 'descend' | null | undefined,
  preSortIndex: Map<string, number>,
): DataRow[] {
  if (!field || !order) return data;
  const dir = order === 'ascend' ? 1 : -1;
  const mult = dir;
  return [...data].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'index':
        cmp = (preSortIndex.get(a.key) ?? 0) - (preSortIndex.get(b.key) ?? 0);
        break;
      case 'id':
        cmp = a.id.trim().localeCompare(b.id.trim(), undefined, { numeric: true });
        break;
      case 'label':
        cmp = a.label.trim().localeCompare(b.label.trim(), undefined, { numeric: true });
        break;
      case 'value':
        cmp = a.value - b.value;
        break;
      case 'time':
        cmp = compareTimePeriodForSort(a.timePeriod, b.timePeriod);
        break;
      default:
        cmp = 0;
    }
    return cmp * mult;
  });
}

export const EMPTY_FILTERS: ColumnFilters = { id: '', label: '', value: '', time: '' };
