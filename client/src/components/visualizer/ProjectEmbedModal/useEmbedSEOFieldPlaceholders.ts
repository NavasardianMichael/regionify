import { useMemo } from 'react';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type Args = {
  defaultEmbedTitle: string;
  projectName: string;
};

export function useEmbedSEOFieldPlaceholders({ defaultEmbedTitle, projectName }: Args) {
  const { t } = useTypedTranslation();

  const titlePlaceholder = useMemo(
    () => t('visualizer.embed.titlePlaceholder', { example: defaultEmbedTitle }),
    [defaultEmbedTitle, t],
  );

  const descriptionPlaceholder = useMemo(
    () => t('visualizer.embed.descriptionPlaceholder', { projectName }),
    [projectName, t],
  );

  return { titlePlaceholder, descriptionPlaceholder };
}
