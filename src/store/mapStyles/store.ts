import { create } from 'zustand';
import type { MapStylesState } from './types';

export const useMapStylesStore = create<MapStylesState>((set) => ({
  border: {
    show: true,
    color: '#FFFFFF',
    width: 1.5,
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

  setMapStylesState: (data) => set((state) => ({ ...state, ...data })),
  setBorder: (data) => set((state) => ({ ...state, border: { ...state.border, ...data } })),
  setShadow: (data) => set((state) => ({ ...state, shadow: { ...state.shadow, ...data } })),
  setZoomControls: (data) =>
    set((state) => ({ ...state, zoomControls: { ...state.zoomControls, ...data } })),
}));
