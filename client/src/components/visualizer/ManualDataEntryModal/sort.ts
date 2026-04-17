import { compareTimePeriodForSort, type DataRow } from '@/helpers/manualDataEntryHelpers';

export function sortTableData(
  data: DataRow[],
  field: string | undefined,
  order: 'ascend' | 'descend' | null | undefined,
): DataRow[] {
  if (!field || !order) return data;
  const dir = order === 'ascend' ? 1 : -1;
  const mult = dir;
  return [...data].sort((a, b) => {
    let cmp = 0;
    switch (field) {
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
