export type DataImportType = 'csv' | 'excel' | 'json' | 'sheets' | 'manual';

export type LegendItem = {
  id: string;
  name: string;
  min: number;
  max: number;
  color: string;
};

export type RegionData = {
  regionId: string;
  value: number;
};

export type MapStylesConfig = {
  border: {
    show: boolean;
    color: string;
    width: number;
  };
  shadow: {
    show: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  zoomControls: {
    show: boolean;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
};

export type LegendStylesConfig = {
  labels: {
    show: boolean;
    color: string;
    fontSize: number;
  };
  position: 'floating' | 'bottom' | 'hidden';
  floatingPosition?: { x: number; y: number };
  floatingSize?: { width: number; height: number };
};

export type JurisdictionOption = {
  value: string;
  label: string;
  mapFile: string;
};
