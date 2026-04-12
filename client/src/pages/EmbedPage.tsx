import { type FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Flex, Spin, Typography } from 'antd';
import { fetchPublicEmbedData, PublicEmbedNotFoundError } from '@/api/embed';
import type { PublicEmbedApiResponse } from '@/api/embed/types';
import type { Project } from '@/api/projects/types';
import { useLoadProject } from '@/hooks/useLoadProject';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { resetVisualizerToDefaultState } from '@/helpers/applyFullTemporaryProjectState';
import { AppNavLink } from '@/components/ui/AppNavLink';
import MapViewer from '@/components/visualizer/MapViewer';
import { EmbedNotFoundView } from '@/pages/EmbedNotFoundView';
import '@/embed/embed-shell.css';

function buildProjectFromEmbedPayload(data: PublicEmbedApiResponse): Project {
  return {
    id: '__embed__',
    name: '',
    countryId: data.countryId,
    dataset: data.dataset,
    mapStyles: data.mapStyles,
    legendStyles: data.legendStyles,
    legendData: data.legendData,
    embed: {
      enabled: false,
      token: null,
      seo: {
        title: null,
        description: null,
        keywords: null,
      },
    },
    createdAt: '',
    updatedAt: '',
  };
}

const EmbedPage: FC = () => {
  const { token } = useParams<{ token: string }>();
  const { t } = useTypedTranslation();
  const loadProject = useLoadProject();
  const [hasError, setHasError] = useState(false);
  const [embedNotFound, setEmbedNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [embedMeta, setEmbedMeta] = useState<{
    title: string | null;
    description: string | null;
  } | null>(null);

  const showClientHeader = embedMeta !== null && !document.querySelector('.embed-shell-header');

  useEffect(() => {
    if (!token) {
      setEmbedNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setEmbedNotFound(false);
    setHasError(false);

    const run = async () => {
      try {
        const data = await fetchPublicEmbedData(token);
        if (cancelled) return;
        resetVisualizerToDefaultState();
        loadProject(buildProjectFromEmbedPayload(data), {
          associateWithProjectsStore: false,
        });
        setEmbedMeta({
          title: data.seoTitle,
          description: data.seoDescription,
        });
        setHasError(false);
      } catch (e) {
        if (!cancelled) {
          if (e instanceof PublicEmbedNotFoundError) {
            setEmbedNotFound(true);
            setHasError(false);
          } else {
            setEmbedNotFound(false);
            setHasError(true);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [token, loadProject]);

  if (loading) {
    return (
      <Flex align="center" justify="center" className="min-h-60 w-full flex-1">
        <Spin size="large" />
      </Flex>
    );
  }

  if (embedNotFound) {
    return <EmbedNotFoundView />;
  }

  if (hasError) {
    return (
      <Flex
        vertical
        align="center"
        justify="center"
        gap="small"
        className="min-h-60 w-full flex-1 p-4"
      >
        <Typography.Text
          type="secondary"
          className="text-center"
          data-i18n-key="visualizer.embed.embedErrorMessage"
        >
          {t('visualizer.embed.embedErrorMessage')}
          <AppNavLink to={ROUTES.CONTACT} data-i18n-key="visualizer.embed.embedErrorContactUs">
            {t('visualizer.embed.embedErrorContactUs')}
          </AppNavLink>
        </Typography.Text>
      </Flex>
    );
  }

  return (
    <Flex vertical className="h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden">
      {showClientHeader && (embedMeta.title ?? embedMeta.description) && (
        <header className="embed-shell-header">
          {embedMeta.title && <h1 className="embed-shell-title">{embedMeta.title}</h1>}
          {embedMeta.description && <p className="embed-shell-intro">{embedMeta.description}</p>}
        </header>
      )}
      <Flex className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <MapViewer className="min-h-0 min-w-0 flex-1" flatEmbedChrome />
      </Flex>
    </Flex>
  );
};

export default EmbedPage;
