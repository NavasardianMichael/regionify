import { useMemo } from 'react';
import type { Project } from '@/api/projects/types';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { buildAutoEmbedTitle, normalizeKeywords, trimDefaultSeoDescription } from './helpers';

export function useEmbedSEOFieldsDefaultValues(project: Project) {
  const { t } = useTypedTranslation();

  const defaultEmbedTitle = useMemo(() => buildAutoEmbedTitle(project.name), [project.name]);

  const defaultSeoDescription = useMemo(
    () =>
      trimDefaultSeoDescription(
        t('visualizer.embed.defaultMetaDescription', { projectName: project.name }),
      ),
    [t, project.name],
  );

  const defaultKeywords = useMemo(
    () => normalizeKeywords(project.embed.seo.keywords),
    [project.embed.seo.keywords],
  );

  return { defaultEmbedTitle, defaultSeoDescription, defaultKeywords };
}
