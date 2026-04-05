import { useVisualizerStore } from '@/store/mapData/store';
import type { DataSet } from '@/store/mapData/types';
import { convertToRegionData, type ParsedRow } from '@/helpers/importDataParsers';

export type CommitParsedImportOutcome =
  | { ok: true; variant: 'timeline'; rowCount: number; periodCount: number }
  | {
      ok: true;
      variant: 'static';
      rowCount: number;
      sideEffect: 'none' | 'info_time_on_observer' | 'warn_no_time_chronographer';
    }
  | { ok: false; reason: 'empty' };

/**
 * Applies parsed import rows to map data stores (same rules as file / sheet import).
 * Does not show toasts — caller handles UX feedback.
 */
export function commitParsedImport(
  parsed: ParsedRow[],
  svgTitles: string[],
  historicalDataImportAllowed: boolean,
): CommitParsedImportOutcome {
  if (parsed.length === 0) {
    return { ok: false, reason: 'empty' };
  }

  const hasTimePeriods = parsed.some((row) => row.timePeriod !== undefined);
  const { setTimelineData, setVisualizerState, clearTimelineData } = useVisualizerStore.getState();

  if (hasTimePeriods && historicalDataImportAllowed) {
    const grouped: Record<string, ParsedRow[]> = {};
    const periodOrder: string[] = [];

    for (const row of parsed) {
      const period = String(row.timePeriod ?? 'Unknown');
      if (!grouped[period]) {
        grouped[period] = [];
        periodOrder.push(period);
      }
      grouped[period].push(row);
    }

    const timeline: Record<string, DataSet> = {};
    for (const period of periodOrder) {
      timeline[period] = convertToRegionData(grouped[period], svgTitles);
    }

    setTimelineData(timeline, periodOrder);
    return {
      ok: true,
      variant: 'timeline',
      rowCount: parsed.length,
      periodCount: periodOrder.length,
    };
  }

  let sideEffect: 'none' | 'info_time_on_observer' | 'warn_no_time_chronographer' = 'none';
  if (hasTimePeriods && !historicalDataImportAllowed) {
    sideEffect = 'info_time_on_observer';
  } else if (historicalDataImportAllowed && !hasTimePeriods) {
    sideEffect = 'warn_no_time_chronographer';
  }

  const regionData = convertToRegionData(parsed, svgTitles);
  clearTimelineData();
  setVisualizerState({ data: regionData });
  return { ok: true, variant: 'static', rowCount: parsed.length, sideEffect };
}
