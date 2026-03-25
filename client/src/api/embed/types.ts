import type {
  ProjectDataset,
  ProjectLegendData,
  ProjectLegendStyles,
  ProjectMapStyles,
} from '@/api/projects/types';

export type PublicEmbedApiResponse = {
  countryId: string | null;
  dataset: ProjectDataset | null;
  mapStyles: ProjectMapStyles | null;
  legendStyles: ProjectLegendStyles | null;
  legendData: ProjectLegendData | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[] | null;
};
