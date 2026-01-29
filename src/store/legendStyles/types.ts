import type { LegendPosition } from '@/types/legendStyles';

export type LegendLabelsConfig = {
  show: boolean;
  color: string;
  fontSize: number;
};

export type LegendStylesState = {
  // State
  labels: LegendLabelsConfig;
  position: LegendPosition;
  floatingPosition: { x: number; y: number };
  floatingSize: { width: number; height: number | 'auto' };

  // Actions
  setLegendStylesState: (data: Partial<LegendStylesState>) => void;
  setLabels: (data: Partial<LegendLabelsConfig>) => void;
};
