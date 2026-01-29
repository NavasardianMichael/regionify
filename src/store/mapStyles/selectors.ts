import type { MapStylesState } from './types';

// State selectors
export const selectBorder = (state: MapStylesState) => state.border;
export const selectShadow = (state: MapStylesState) => state.shadow;
export const selectZoomControls = (state: MapStylesState) => state.zoomControls;

// Border sub-selectors
export const selectBorderShow = (state: MapStylesState) => state.border.show;
export const selectBorderColor = (state: MapStylesState) => state.border.color;
export const selectBorderWidth = (state: MapStylesState) => state.border.width;

// Shadow sub-selectors
export const selectShadowShow = (state: MapStylesState) => state.shadow.show;
export const selectShadowColor = (state: MapStylesState) => state.shadow.color;
export const selectShadowBlur = (state: MapStylesState) => state.shadow.blur;

// Zoom controls sub-selectors
export const selectZoomControlsShow = (state: MapStylesState) => state.zoomControls.show;
export const selectZoomControlsPosition = (state: MapStylesState) => state.zoomControls.position;

// Action selectors
export const selectSetBorder = (state: MapStylesState) => state.setBorder;
export const selectSetShadow = (state: MapStylesState) => state.setShadow;
export const selectSetZoomControls = (state: MapStylesState) => state.setZoomControls;
export const selectSetMapStylesState = (state: MapStylesState) => state.setMapStylesState;
