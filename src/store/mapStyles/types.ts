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

export type MapStylesState = {
  // State
  border: BorderConfig;
  shadow: ShadowConfig;
  zoomControls: ZoomControlsConfig;
  picture: PictureConfig;

  // Actions
  setMapStylesState: (data: Partial<MapStylesState>) => void;
  setBorder: (data: Partial<BorderConfig>) => void;
  setShadow: (data: Partial<ShadowConfig>) => void;
  setZoomControls: (data: Partial<ZoomControlsConfig>) => void;
  setPicture: (data: Partial<PictureConfig>) => void;
};
