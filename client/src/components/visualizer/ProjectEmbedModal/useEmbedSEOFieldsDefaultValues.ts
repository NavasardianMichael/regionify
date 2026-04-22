import { useMemo } from 'react';
import type { Project } from '@/api/projects/types';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { buildAutoEmbedTitle, normalizeKeywords, trimDefaultSeoDescription } from './helpers';

const DEFAULT_ORIGIN_PLACEHOLDER = 'https://example.com';

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

  const defaultAllowedOriginsAllowAll = useMemo(() => {
    const stored = project.embed.seo.allowedOrigins;
    return Array.isArray(stored) && stored.length === 1 && stored[0] === '*';
  }, [project.embed.seo.allowedOrigins]);

  const defaultAllowedOrigins = useMemo(() => {
    const stored = project.embed.seo.allowedOrigins;
    if (defaultAllowedOriginsAllowAll) return [];
    if (!Array.isArray(stored) || stored.length === 0) return [DEFAULT_ORIGIN_PLACEHOLDER];
    return stored.filter((v): v is string => typeof v === 'string' && v !== '*');
  }, [project.embed.seo.allowedOrigins, defaultAllowedOriginsAllowAll]);

  return {
    defaultEmbedTitle,
    defaultSeoDescription,
    defaultKeywords,
    defaultAllowedOrigins,
    defaultAllowedOriginsAllowAll,
  };
}
