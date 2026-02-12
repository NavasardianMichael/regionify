import { z } from 'zod';

const GOOGLE_SHEETS_URL_REGEX = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;

export const fetchSheetSchema = z.object({
  url: z
    .string()
    .min(1, 'Google Sheets URL is required')
    .regex(GOOGLE_SHEETS_URL_REGEX, 'Invalid Google Sheets URL'),
  sheetName: z.string().max(100).optional(),
});

export type FetchSheetInput = z.infer<typeof fetchSheetSchema>;

/**
 * Extracts the spreadsheet ID from a Google Sheets URL.
 */
export const extractSpreadsheetId = (url: string): string | null => {
  const match = url.match(GOOGLE_SHEETS_URL_REGEX);
  return match?.[1] ?? null;
};

/**
 * Extracts the GID (sheet tab ID) from a Google Sheets URL hash fragment.
 */
export const extractGid = (url: string): string | null => {
  const match = url.match(/[#&]gid=(\d+)/);
  return match?.[1] ?? null;
};
