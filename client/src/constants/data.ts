export const IMPORT_DATA_TYPES = {
  csv: 'csv',
  excel: 'excel',
  json: 'json',
  sheets: 'sheets',
  table: 'table',
  tabDelimited: 'tab_delimited',
  aiParser: 'ai_parser',
} as const;

/** Same union as `VisualizerState.importDataType` / persisted `ProjectDataset.importDataType`. */
export type ImportDataType = (typeof IMPORT_DATA_TYPES)[keyof typeof IMPORT_DATA_TYPES];

/** i18n keys under `common` for persisted `ProjectDataset.importDataType` values. */
export const IMPORT_FORMAT_LABEL_I18N_KEYS = {
  [IMPORT_DATA_TYPES.csv]: 'visualizer.importData.format.csv',
  [IMPORT_DATA_TYPES.excel]: 'visualizer.importData.format.excel',
  [IMPORT_DATA_TYPES.json]: 'visualizer.importData.format.json',
  [IMPORT_DATA_TYPES.sheets]: 'visualizer.importData.format.sheets',
  [IMPORT_DATA_TYPES.table]: 'visualizer.importData.format.table',
  [IMPORT_DATA_TYPES.tabDelimited]: 'visualizer.importData.format.tabDelimited',
  [IMPORT_DATA_TYPES.aiParser]: 'visualizer.importData.format.aiParser',
} as const satisfies Record<ImportDataType, string>;

/** Matches uppercase letters to split camelCase country IDs into spaced words. */
export const COUNTRY_ID_SPLIT_REGEX = /([A-Z])/g;

/** Date format options for project card last-updated display. */
export const PROJECT_DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
} as const;

/** Muted SVG path fill for project card map thumbnails (Tailwind gray-400). */
export const MAP_THUMBNAIL_SVG_FILL = '#9ca3af';

/** Maximum number of AI parse requests allowed per user per day (Chronographer plan). */
export const MAX_AI_PARSE_REQUESTS_PER_DAY = 3;
