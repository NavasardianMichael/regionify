export type BorderConfig = {
  show: boolean;
  color: string;
  width: number;
};

export type ShadowConfig = {
  show: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
};

export type ZoomControlsConfig = {
  show: boolean;
  position: { x: number; y: number };
};

export type PictureConfig = {
  transparentBackground: boolean;
  backgroundColor: string;
};

export type RegionLabelsConfig = {
  show: boolean;
  color: string;
  fontSize: number;
};

/** SVG-space positions for region labels (path title → { x, y }). Used for export and persistence. */
export type RegionLabelPositions = Record<string, { x: number; y: number }>;

export type MapStylesState = {
  // State
  border: BorderConfig;
  shadow: ShadowConfig;
  zoomControls: ZoomControlsConfig;
  picture: PictureConfig;
  regionLabels: RegionLabelsConfig;
  /** Dragged region label positions (current map only). Cleared when region changes. */
  regionLabelPositions: RegionLabelPositions;

  // Actions
  setMapStylesState: (data: Partial<MapStylesState>) => void;
  setBorder: (data: Partial<BorderConfig>) => void;
  setShadow: (data: Partial<ShadowConfig>) => void;
  setZoomControls: (data: Partial<ZoomControlsConfig>) => void;
  setPicture: (data: Partial<PictureConfig>) => void;
  setRegionLabels: (data: Partial<RegionLabelsConfig>) => void;
  setRegionLabelPositions: (positions: RegionLabelPositions) => void;
};
