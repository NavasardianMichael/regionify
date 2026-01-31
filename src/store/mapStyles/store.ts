import { create } from 'zustand';
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
  picture: {
    transparentBackground: true,
    backgroundColor: '#F5F5F5',
  },
  regionLabels: {
    show: false,
    color: '#333333',
    fontSize: 10,
  },

  setMapStylesState: (data) => set((state) => ({ ...state, ...data })),
  setBorder: (data) => set((state) => ({ ...state, border: { ...state.border, ...data } })),
  setShadow: (data) => set((state) => ({ ...state, shadow: { ...state.shadow, ...data } })),
  setZoomControls: (data) =>
    set((state) => ({ ...state, zoomControls: { ...state.zoomControls, ...data } })),
  setPicture: (data) => set((state) => ({ ...state, picture: { ...state.picture, ...data } })),
  setRegionLabels: (data) =>
    set((state) => ({ ...state, regionLabels: { ...state.regionLabels, ...data } })),
}));
