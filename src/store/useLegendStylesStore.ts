import { create } from 'zustand';
import type { LegendStylesConfig } from '@/types/visualizer';

type LegendStylesState = {
  legendStyles: LegendStylesConfig;
  updateLegendStyles: (updates: Partial<LegendStylesConfig>) => void;
  updateLabelStyles: (updates: Partial<LegendStylesConfig['labels']>) => void;
  resetLegendStyles: () => void;
};

const DEFAULT_LEGEND_STYLES: LegendStylesConfig = {
  labels: {
    show: true,
    color: '#18294D',
    fontSize: 12,
  },
  position: 'floating',
  floatingPosition: { x: 20, y: 20 },
  floatingSize: { width: 160, height: 'auto' as unknown as number },
};

export const useLegendStylesStore = create<LegendStylesState>((set) => ({
  legendStyles: DEFAULT_LEGEND_STYLES,

  updateLegendStyles: (updates) =>
    set((state) => ({
      legendStyles: { ...state.legendStyles, ...updates },
    })),

  updateLabelStyles: (updates) =>
    set((state) => ({
      legendStyles: {
        ...state.legendStyles,
        labels: { ...state.legendStyles.labels, ...updates },
      },
    })),

  resetLegendStyles: () => set({ legendStyles: DEFAULT_LEGEND_STYLES }),
}));
