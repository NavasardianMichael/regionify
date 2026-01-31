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
  noDataColor: '#E5E7EB',

  setLegendStylesState: (data) => set((state) => ({ ...state, ...data })),
  setLabels: (data) => set((state) => ({ ...state, labels: { ...state.labels, ...data } })),
  setTitle: (data) => set((state) => ({ ...state, title: { ...state.title, ...data } })),
}));
