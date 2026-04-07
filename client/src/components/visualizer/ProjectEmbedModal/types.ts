import type { Project } from '@/api/projects/types';

export type ProjectEmbedFormValues = {
  enabled: boolean;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
};

export type ProjectEmbedModalProps = {
  open: boolean;
  onClose: () => void;
  project: Project;
};
