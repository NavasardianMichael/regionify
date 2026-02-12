import { ErrorCode, extractGid, extractSpreadsheetId, HttpStatus } from '@regionify/shared';

import { logger } from '../lib/logger.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Builds the CSV export URL for a public Google Sheet.
 */
function buildCsvExportUrl(spreadsheetId: string, gid: string | null): string {
  const base = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
  return gid ? `${base}&gid=${gid}` : base;
}

/**
 * Fetches the CSV content of a public Google Sheet.
 *
 * @param url - Full Google Sheets URL
 * @returns CSV string content
 */
async function fetchPublicSheet(url: string): Promise<string> {
  const spreadsheetId = extractSpreadsheetId(url);
  if (!spreadsheetId) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR,
      'Invalid Google Sheets URL',
    );
  }

  const gid = extractGid(url);
  const csvUrl = buildCsvExportUrl(spreadsheetId, gid);

  logger.debug({ csvUrl, spreadsheetId, gid }, 'Fetching public Google Sheet');

  const response = await fetch(csvUrl, {
    headers: {
      'User-Agent': 'Regionify/1.0',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND,
        'Google Sheet not found. Check the URL.',
      );
    }
    if (response.status === 403 || response.status === 401) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'This Google Sheet is not publicly accessible. Make sure the sheet is shared as "Anyone with the link".',
      );
    }
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_ERROR,
      'Failed to fetch Google Sheet. Please try again.',
    );
  }

  const contentType = response.headers.get('content-type') ?? '';

  // Google redirects to a login page for private sheets — detect HTML responses
  if (contentType.includes('text/html')) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      'This Google Sheet is not publicly accessible. Make sure the sheet is shared as "Anyone with the link".',
    );
  }

  const csv = await response.text();

  if (!csv.trim()) {
    throw new AppError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.VALIDATION_ERROR,
      'The Google Sheet appears to be empty.',
    );
  }

  return csv;
}

export const sheetsService = {
  fetchPublicSheet,
};
