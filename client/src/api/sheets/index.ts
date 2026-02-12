import { SHEETS_ENDPOINTS } from './endpoints';
import type { FetchSheetPayload, FetchSheetResponse } from './types';

/**
 * Fetches a public Google Sheet as CSV via the server proxy.
 */
export const fetchGoogleSheet = async (payload: FetchSheetPayload): Promise<string> => {
  const response = await fetch(SHEETS_ENDPOINTS.fetch, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as FetchSheetResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message ?? 'Failed to fetch Google Sheet');
  }

  return data.data.csv;
};
