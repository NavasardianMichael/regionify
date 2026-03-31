export const IMPORT_DATA_TYPES = {
  csv: 'csv',
  excel: 'excel',
  json: 'json',
  sheets: 'sheets',
  manual: 'manual',
} as const;

/** Matches uppercase letters to split camelCase country IDs into spaced words. */
export const COUNTRY_ID_SPLIT_REGEX = /([A-Z])/g;

/** Date format options for project card last-updated display. */
export const PROJECT_DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
} as const;
