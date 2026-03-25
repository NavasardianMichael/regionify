import type { RegionData } from '@/store/mapData/types';

export type ProjectDataset = {
  allIds: string[];
  byId: Record<string, RegionData>;
  importDataType: string;
  /** Present when data was imported from Google Sheets. */
  google?: {
    url: string;
    gid: string | null;
  } | null;
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
  regionLabels: {
    show: boolean;
    color: string;
    fontSize: number;
    labelPositionsByRegionId?: Record<string, { x: number; y: number }>;
  };
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
  countryId: string | null;
  dataset: ProjectDataset | null;
  mapStyles: ProjectMapStyles | null;
  legendStyles: ProjectLegendStyles | null;
  legendData: ProjectLegendData | null;
  embedEnabled: boolean;
  embedToken: string | null;
  embedSeoTitle: string | null;
  embedSeoDescription: string | null;
  embedSeoKeywords: string[] | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectEmbedUpdatePayload = {
  enabled: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
};

export type ProjectEmbedSettingsResponse = {
  embedEnabled: boolean;
  embedToken: string | null;
  embedSeoTitle: string | null;
  embedSeoDescription: string | null;
  embedSeoKeywords: unknown;
};

export type ProjectCreatePayload = {
  name: string;
  countryId?: string | null;
  dataset?: ProjectDataset | null;
  mapStyles?: ProjectMapStyles | null;
  legendStyles?: ProjectLegendStyles | null;
  legendData?: ProjectLegendData | null;
};

export type ProjectUpdatePayload = Partial<ProjectCreatePayload>;
