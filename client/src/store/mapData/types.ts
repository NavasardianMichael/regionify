import type { ImportDataType, RegionId } from '@/types/mapData';

export type RegionData = {
  id: string;
  label: string;
  value: number;
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
  data: {
    allIds: RegionData['id'][];
    byId: Record<RegionData['id'], RegionData>;
  };

  // Actions
  setVisualizerState: (data: Partial<VisualizerState>) => void;
};
