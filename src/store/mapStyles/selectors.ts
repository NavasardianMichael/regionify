import type { MapStylesState } from './types';

// State selectors
export const selectBorder = (state: MapStylesState) => state.border;
export const selectShadow = (state: MapStylesState) => state.shadow;
export const selectZoomControls = (state: MapStylesState) => state.zoomControls;
export const selectPicture = (state: MapStylesState) => state.picture;

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

// Region labels selectors
export const selectRegionLabels = (state: MapStylesState) => state.regionLabels;
export const selectRegionLabelsShow = (state: MapStylesState) => state.regionLabels.show;
export const selectRegionLabelsColor = (state: MapStylesState) => state.regionLabels.color;
export const selectRegionLabelsFontSize = (state: MapStylesState) => state.regionLabels.fontSize;

// Action selectors
export const selectSetMapStylesState = (state: MapStylesState) => state.setMapStylesState;
export const selectSetBorder = (state: MapStylesState) => state.setBorder;
export const selectSetShadow = (state: MapStylesState) => state.setShadow;
export const selectSetZoomControls = (state: MapStylesState) => state.setZoomControls;
export const selectSetPicture = (state: MapStylesState) => state.setPicture;
export const selectSetRegionLabels = (state: MapStylesState) => state.setRegionLabels;
