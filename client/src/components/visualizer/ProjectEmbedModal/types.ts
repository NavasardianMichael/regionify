import type { Project } from '@/api/projects/types';

export type ProjectEmbedFormValues = {
  enabled: boolean;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  allowedOriginsAllowAll: boolean;
  allowedOrigins: string[];
  showHeader: boolean;
};

export type ProjectEmbedModalProps = {
  open: boolean;
  onClose: () => void;
  project: Project;
};
