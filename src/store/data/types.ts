import type { ImportDataType, JurisdictionId } from '@/types/data';

type RegionData = {
  id: string;
  label: string;
  value: number;
};

export type VisualizerState = {
  // State
  importDataType: ImportDataType;
  selectedJurisdictionId: JurisdictionId | null;
  data: {
    allIds: RegionData['id'][];
    byId: Record<RegionData['id'], RegionData>;
  };

  // Actions
  setVisualizerState: (data: Partial<VisualizerState>) => void;
};
