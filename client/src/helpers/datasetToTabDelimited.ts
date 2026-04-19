import type { DataSet } from '@/store/mapData/types';
import type { ParsedRow } from '@/helpers/importDataParsers';

const STATIC_HEADER = 'id\tlabel\tvalue';
const TIME_HEADER = 'id\tlabel\tvalue\ttime';

/**
 * Serialize the current visualizer dataset (static or time-series) into a
 * tab-delimited string ready to be edited or fed to the AI parser.
 */
export const datasetToTabDelimited = (
  data: DataSet,
  timelineData: Record<string, DataSet>,
  timePeriods: string[],
): string => {
  if (timePeriods.length > 0) {
    const lines: string[] = [TIME_HEADER];
    for (const period of timePeriods) {
      const ds = timelineData[period];
      if (!ds) continue;
      for (const id of ds.allIds) {
        const r = ds.byId[id];
        lines.push(`${r.id}\t${r.label}\t${r.value}\t${period}`);
      }
    }
    return lines.length > 1 ? lines.join('\n') : '';
  }

  if (data.allIds.length === 0) return '';

  const lines: string[] = [STATIC_HEADER];
  for (const id of data.allIds) {
    const r = data.byId[id];
    lines.push(`${r.id}\t${r.label}\t${r.value}`);
  }
  return lines.join('\n');
};

/**
 * Serialize parsed rows back to tab-delimited text. The header automatically
 * includes a `time` column when any row has a non-empty `timePeriod`.
 */
export const rowsToTabDelimited = (rows: ParsedRow[]): string => {
  if (rows.length === 0) return '';
  const hasTime = rows.some((r) => r.timePeriod !== undefined && r.timePeriod !== '');
  const header = hasTime ? TIME_HEADER : STATIC_HEADER;
  const lines = rows.map((r) =>
    hasTime
      ? `${r.id}\t${r.label}\t${r.value}\t${r.timePeriod ?? ''}`
      : `${r.id}\t${r.label}\t${r.value}`,
  );
  return [header, ...lines].join('\n');
};
