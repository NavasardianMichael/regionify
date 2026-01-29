import type { VisualizerState } from './types';

// State selectors
export const selectImportDataType = (state: VisualizerState) => state.importDataType;
export const selectSelectedJurisdictionId = (state: VisualizerState) =>
  state.selectedJurisdictionId;
export const selectData = (state: VisualizerState) => state.data;
export const selectDataAllIds = (state: VisualizerState) => state.data.allIds;
export const selectDataById = (state: VisualizerState) => state.data.byId;

// Action selectors
export const selectSetVisualizerState = (state: VisualizerState) => state.setVisualizerState;
