import type { ImportDataType, RegionId } from '@/types/mapData';

export type RegionData = {
  id: string;
  label: string;
  value: number;
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

export type VisualizerState = {
  // State
  importDataType: ImportDataType;
  selectedRegionId: RegionId | null;
  data: DataSet;

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
