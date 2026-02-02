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
