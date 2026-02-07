import type { RegionData } from '@/store/mapData/types';

export type ProjectDataset = {
  allIds: string[];
  byId: Record<string, RegionData>;
  importDataType: string;
};

export type ProjectMapStyles = {
  border: { show: boolean; color: string; width: number };
  shadow: {
    show: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  zoomControls: { show: boolean; position: { x: number; y: number } };
  picture: { transparentBackground: boolean; backgroundColor: string };
  regionLabels: { show: boolean; color: string; fontSize: number };
};

export type ProjectLegendStyles = {
  labels: { color: string; fontSize: number };
  title: { show: boolean; text: string };
  position: string;
  floatingPosition: { x: number; y: number };
  floatingSize: { width: number; height: number | 'auto' };
  backgroundColor: string;
  noDataColor: string;
};

export type ProjectLegendData = {
  items: Array<{
    id: string;
    name: string;
    min: number;
    max: number;
    color: string;
  }>;
};

export type Project = {
  id: string;
  name: string;
  selectedRegionId: string | null;
  dataset: ProjectDataset | null;
  mapStyles: ProjectMapStyles | null;
  legendStyles: ProjectLegendStyles | null;
  legendData: ProjectLegendData | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectCreatePayload = {
  name: string;
  selectedRegionId?: string | null;
  dataset?: ProjectDataset | null;
  mapStyles?: ProjectMapStyles | null;
  legendStyles?: ProjectLegendStyles | null;
  legendData?: ProjectLegendData | null;
};

export type ProjectUpdatePayload = Partial<ProjectCreatePayload>;
