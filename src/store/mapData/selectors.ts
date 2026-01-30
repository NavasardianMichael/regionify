import type { VisualizerState } from './types';

// State selectors
export const selectImportDataType = (state: VisualizerState) => state.importDataType;
export const selectSelectedRegionId = (state: VisualizerState) => state.selectedRegionId;
export const selectData = (state: VisualizerState) => state.data;
export const selectDataAllIds = (state: VisualizerState) => state.data.allIds;
export const selectDataById = (state: VisualizerState) => state.data.byId;

// Action selectors
export const selectSetVisualizerState = (state: VisualizerState) => state.setVisualizerState;
