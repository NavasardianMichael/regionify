import type { VisualizerState } from './types';

// State selectors
export const selectImportDataType = (state: VisualizerState) => state.importDataType;
export const selectSelectedRegionId = (state: VisualizerState) => state.selectedRegionId;
export const selectData = (state: VisualizerState) => state.data;
export const selectDataAllIds = (state: VisualizerState) => state.data.allIds;
export const selectDataById = (state: VisualizerState) => state.data.byId;

// Timeline selectors
export const selectTimelineData = (state: VisualizerState) => state.timelineData;
export const selectTimePeriods = (state: VisualizerState) => state.timePeriods;
export const selectActiveTimePeriod = (state: VisualizerState) => state.activeTimePeriod;
export const selectHasTimelineData = (state: VisualizerState) => state.timePeriods.length > 1;

// Action selectors
export const selectSetVisualizerState = (state: VisualizerState) => state.setVisualizerState;
export const selectSetTimelineData = (state: VisualizerState) => state.setTimelineData;
export const selectSetActiveTimePeriod = (state: VisualizerState) => state.setActiveTimePeriod;
export const selectClearTimelineData = (state: VisualizerState) => state.clearTimelineData;
