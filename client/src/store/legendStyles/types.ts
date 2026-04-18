import type { LegendPosition } from '@/types/legendStyles';

export type LegendLabelsConfig = {
  color: string;
  fontSize: number;
};

export type LegendTitleConfig = {
  show: boolean;
  text: string;
};

export type LegendFrameSize = { width: number; height: number };

export type LegendStylesState = {
  // State
  labels: LegendLabelsConfig;
  title: LegendTitleConfig;
  position: LegendPosition;
  floatingPosition: { x: number; y: number };
  floatingSize: { width: number; height: number | 'auto' };
  /**
   * Last measured map frame in the editor, or frame size from API when a project/embed loads.
   * Excluded from dirty-check snapshots so window resizes do not mark the project unsaved.
   */
  floatingMapFrameSize: LegendFrameSize | null;
  transparentBackground: boolean;
  backgroundColor: string;
  noDataColor: string;

  // Actions
  setLegendStylesState: (data: Partial<LegendStylesState>) => void;
  setLabels: (data: Partial<LegendLabelsConfig>) => void;
  setTitle: (data: Partial<LegendTitleConfig>) => void;
};
