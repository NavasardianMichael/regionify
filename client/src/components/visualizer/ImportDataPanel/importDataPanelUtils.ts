import type { MessageInstance } from 'antd/es/message/interface';
import type { DataSet } from '@/store/mapData/types';

export const SUCCESS_MESSAGE_DURATION = 5;
export const FEEDBACK_MESSAGE_DURATION = 5;

/**
 * When every stored region id exists on the loaded map SVG, keep the current dataset
 * (e.g. project just loaded). Otherwise sample data would overwrite saved imports.
 */
export function storeDataMatchesMapTitles(
  titles: string[],
  data: DataSet,
  timePeriods: string[],
  timelineData: Record<string, DataSet>,
): boolean {
  if (titles.length === 0) return false;
  const titleSet = new Set(titles);
  if (timePeriods.length > 0) {
    return timePeriods.every((p) => {
      const ds = timelineData[p];
      return ds && ds.allIds.length > 0 && ds.allIds.every((id) => titleSet.has(id));
    });
  }
  if (data.allIds.length === 0) return false;
  return data.allIds.every((id) => titleSet.has(id));
}

/** All feedback types auto-hide after 5s; the close control allows early dismissal. */
export function showMessageWithClose(
  messageApi: MessageInstance,
  type: 'success' | 'info' | 'warning' | 'error',
  content: string,
): void {
  const duration = type === 'success' ? SUCCESS_MESSAGE_DURATION : FEEDBACK_MESSAGE_DURATION;
  messageApi[type]({ content, duration });
}
