import { create } from 'zustand';
import { IMPORT_DATA_TYPES } from '@/constants/data';
import type { VisualizerState } from './types';

const EMPTY_DATA_SET = { allIds: [] as string[], byId: {} as Record<string, never> };

export const useVisualizerStore = create<VisualizerState>((set) => ({
  importDataType: IMPORT_DATA_TYPES.csv,
  data: EMPTY_DATA_SET,
  selectedRegionId: null,

  // Timeline state
  timelineData: {},
  timePeriods: [],
  activeTimePeriod: null,

  setVisualizerState: (data) => set((state) => ({ ...state, ...data })),

  setTimelineData: (timelineData, timePeriods) =>
    set({
      timelineData,
      timePeriods,
      activeTimePeriod: timePeriods[0] ?? null,
      data: timePeriods[0] ? timelineData[timePeriods[0]] : EMPTY_DATA_SET,
    }),

  setActiveTimePeriod: (period) =>
    set((state) => ({
      activeTimePeriod: period,
      data: state.timelineData[period] ?? EMPTY_DATA_SET,
    })),

  clearTimelineData: () =>
    set({
      timelineData: {},
      timePeriods: [],
      activeTimePeriod: null,
    }),
}));
