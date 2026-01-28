import { create } from 'zustand';
import type { MapStylesConfig } from '@/types/visualizer';

type MapStylesState = {
  mapStyles: MapStylesConfig;
  updateMapStyles: (updates: Partial<MapStylesConfig>) => void;
  updateBorderStyles: (updates: Partial<MapStylesConfig['border']>) => void;
  updateShadowStyles: (updates: Partial<MapStylesConfig['shadow']>) => void;
  updateZoomControlStyles: (updates: Partial<MapStylesConfig['zoomControls']>) => void;
  resetMapStyles: () => void;
};

const DEFAULT_MAP_STYLES: MapStylesConfig = {
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
    position: 'bottom-right',
  },
};

export const useMapStylesStore = create<MapStylesState>((set) => ({
  mapStyles: DEFAULT_MAP_STYLES,

  updateMapStyles: (updates) =>
    set((state) => ({
      mapStyles: { ...state.mapStyles, ...updates },
    })),

  updateBorderStyles: (updates) =>
    set((state) => ({
      mapStyles: {
        ...state.mapStyles,
        border: { ...state.mapStyles.border, ...updates },
      },
    })),

  updateShadowStyles: (updates) =>
    set((state) => ({
      mapStyles: {
        ...state.mapStyles,
        shadow: { ...state.mapStyles.shadow, ...updates },
      },
    })),

  updateZoomControlStyles: (updates) =>
    set((state) => ({
      mapStyles: {
        ...state.mapStyles,
        zoomControls: { ...state.mapStyles.zoomControls, ...updates },
      },
    })),

  resetMapStyles: () => set({ mapStyles: DEFAULT_MAP_STYLES }),
}));
