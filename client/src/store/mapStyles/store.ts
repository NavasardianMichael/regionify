import { create } from 'zustand';
import { DEFAULT_MAP_PICTURE } from '@/constants/mapStyles';
import type { MapStylesState } from './types';

export const useMapStylesStore = create<MapStylesState>((set) => ({
  border: {
    show: true,
    color: '#FFFFFF',
    width: 1,
  },
  shadow: {
    show: false,
    color: '#000000',
    blur: 10,
    offsetX: 0,
    offsetY: 4,
  },
  zoomControls: {
    show: true,
    position: { x: 20, y: 20 },
  },
  picture: { ...DEFAULT_MAP_PICTURE },
  regionLabels: {
    show: false,
    color: '#333333',
    fontSize: 10,
    labelPositionsByRegionId: {},
  },
  timePeriodLabelOffset: { x: 0, y: 0 },

  setMapStylesState: (data) => set((state) => ({ ...state, ...data })),
  setBorder: (data) => set((state) => ({ ...state, border: { ...state.border, ...data } })),
  setShadow: (data) => set((state) => ({ ...state, shadow: { ...state.shadow, ...data } })),
  setZoomControls: (data) =>
    set((state) => ({ ...state, zoomControls: { ...state.zoomControls, ...data } })),
  setPicture: (data) => set((state) => ({ ...state, picture: { ...state.picture, ...data } })),
  setRegionLabels: (data) =>
    set((state) => ({ ...state, regionLabels: { ...state.regionLabels, ...data } })),
  setLabelPositionsByRegionId: (labelPositionsByRegionId) =>
    set((state) => ({
      regionLabels: {
        ...state.regionLabels,
        labelPositionsByRegionId,
      },
    })),
}));
