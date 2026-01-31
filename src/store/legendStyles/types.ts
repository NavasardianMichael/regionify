import type { LegendPosition } from '@/types/legendStyles';

export type LegendLabelsConfig = {
  show: boolean;
  color: string;
  fontSize: number;
};

export type LegendTitleConfig = {
  show: boolean;
  text: string;
};

export type LegendStylesState = {
  // State
  labels: LegendLabelsConfig;
  title: LegendTitleConfig;
  position: LegendPosition;
  floatingPosition: { x: number; y: number };
  floatingSize: { width: number; height: number | 'auto' };
  backgroundColor: string;
  noDataColor: string;

  // Actions
  setLegendStylesState: (data: Partial<LegendStylesState>) => void;
  setLabels: (data: Partial<LegendLabelsConfig>) => void;
  setTitle: (data: Partial<LegendTitleConfig>) => void;
};
