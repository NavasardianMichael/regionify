import { create } from 'zustand';
import { IMPORT_DATA_TYPES } from '@/constants/data';
import type { VisualizerState } from './types';

export const useVisualizerStore = create<VisualizerState>((set) => ({
  importDataType: IMPORT_DATA_TYPES.csv,
  data: {
    allIds: [],
    byId: {},
  },
  selectedRegionId: null,
  setVisualizerState: (data) => set((state) => ({ ...state, ...data })),
}));

// Selectors
export const selectImportDataType = (state: VisualizerState) => state.importDataType;
export const selectData = (state: VisualizerState) => state.data;
export const selectSelectedRegionId = (state: VisualizerState) => state.selectedRegionId;
export const selectSetVisualizerState = (state: VisualizerState) => state.setVisualizerState;
