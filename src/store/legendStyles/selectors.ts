import type { LegendStylesState } from './types';

// State selectors
export const selectLabels = (state: LegendStylesState) => state.labels;
export const selectPosition = (state: LegendStylesState) => state.position;
export const selectFloatingPosition = (state: LegendStylesState) => state.floatingPosition;
export const selectFloatingSize = (state: LegendStylesState) => state.floatingSize;

// Labels sub-selectors
export const selectLabelsShow = (state: LegendStylesState) => state.labels.show;
export const selectLabelsColor = (state: LegendStylesState) => state.labels.color;
export const selectLabelsFontSize = (state: LegendStylesState) => state.labels.fontSize;

// Action selectors
export const selectSetLabels = (state: LegendStylesState) => state.setLabels;
export const selectSetLegendStylesState = (state: LegendStylesState) => state.setLegendStylesState;
