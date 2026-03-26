import type { CountryId, ImportDataType } from '@/types/mapData';

export type RegionData = {
  id: string;
  label: string;
  value: number;
  /** When true, region is omitted from map fill and region labels (like no data on the map). */
  hidden?: boolean;
};

export type DataSet = {
  allIds: RegionData['id'][];
  byId: Record<RegionData['id'], RegionData>;
};

export type RegionOption = {
  value: string;
  label: string;
  mapFile: string;
};

/** Google Sheets tab id from the URL is a string (e.g. hash `gid=0`). */
export type GoogleSheetSource = {
  url: string | null;
  gid: string | null;
};

export type VisualizerState = {
  // State
  importDataType: ImportDataType;
  selectedCountryId: CountryId | null;
  data: DataSet;
  /** When import is Google Sheets, the public sheet URL and tab id. */
  google: GoogleSheetSource;

  // Timeline state
  timelineData: Record<string, DataSet>;
  timePeriods: string[];
  activeTimePeriod: string | null;

  // Actions
  setVisualizerState: (data: Partial<VisualizerState>) => void;
  setTimelineData: (timelineData: Record<string, DataSet>, timePeriods: string[]) => void;
  setActiveTimePeriod: (period: string) => void;
  clearTimelineData: () => void;
};
