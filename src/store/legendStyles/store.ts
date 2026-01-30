import { create } from 'zustand';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';
import type { LegendStylesState } from './types';

export const useLegendStylesStore = create<LegendStylesState>((set) => ({
  labels: {
    show: true,
    color: '#18294D',
    fontSize: 12,
  },
  title: {
    show: true,
    text: 'INTENSITY RATIO',
  },
  position: LEGEND_POSITIONS.floating,
  floatingPosition: { x: 20, y: 20 },
  floatingSize: { width: 160, height: 'auto' },
  backgroundColor: 'rgba(255, 255, 255, 0.95)',

  setLegendStylesState: (data) => set((state) => ({ ...state, ...data })),
  setLabels: (data) => set((state) => ({ ...state, labels: { ...state.labels, ...data } })),
  setTitle: (data) => set((state) => ({ ...state, title: { ...state.title, ...data } })),
}));

// Selectors
export const selectLabels = (state: LegendStylesState) => state.labels;
export const selectTitle = (state: LegendStylesState) => state.title;
export const selectPosition = (state: LegendStylesState) => state.position;
export const selectFloatingPosition = (state: LegendStylesState) => state.floatingPosition;
export const selectFloatingSize = (state: LegendStylesState) => state.floatingSize;
export const selectBackgroundColor = (state: LegendStylesState) => state.backgroundColor;
export const selectSetLegendStylesState = (state: LegendStylesState) => state.setLegendStylesState;
export const selectSetLabels = (state: LegendStylesState) => state.setLabels;
export const selectSetTitle = (state: LegendStylesState) => state.setTitle;
