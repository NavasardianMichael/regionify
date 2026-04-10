import { type FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Flex, Spin, Typography } from 'antd';
import { fetchPublicEmbedData, PublicEmbedNotFoundError } from '@/api/embed';
import type { PublicEmbedApiResponse } from '@/api/embed/types';
import type { Project } from '@/api/projects/types';
import { useLoadProject } from '@/hooks/useLoadProject';
import { resetVisualizerToDefaultState } from '@/helpers/applyFullTemporaryProjectState';
import MapViewer from '@/components/visualizer/MapViewer';
import { EmbedNotFoundView } from '@/pages/EmbedNotFoundView';

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
  const loadProject = useLoadProject();
  const [error, setError] = useState<string | null>(null);
  const [embedNotFound, setEmbedNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setEmbedNotFound(false);
      setError('Invalid embed link');
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setEmbedNotFound(false);
    setError(null);

    const run = async () => {
      try {
        const data = await fetchPublicEmbedData(token);
        if (cancelled) return;
        resetVisualizerToDefaultState();
        loadProject(buildProjectFromEmbedPayload(data), {
          associateWithProjectsStore: false,
        });
        setError(null);
      } catch (e) {
        if (!cancelled) {
          if (e instanceof PublicEmbedNotFoundError) {
            setEmbedNotFound(true);
            setError(null);
          } else {
            setEmbedNotFound(false);
            setError(e instanceof Error ? e.message : 'Failed to load map');
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
      <Flex align="center" justify="center" className="min-h-[240px] min-w-0 flex-1">
        <Spin size="large" />
      </Flex>
    );
  }

  if (embedNotFound) {
    return <EmbedNotFoundView />;
  }

  if (error) {
    return (
      <Flex
        vertical
        align="center"
        justify="center"
        gap="small"
        className="min-h-[240px] min-w-0 flex-1 p-4"
      >
        <Typography.Title level={4} className="mb-0! text-center">
          Could not load embed
        </Typography.Title>
        <Typography.Text type="danger" className="text-center">
          {error}
        </Typography.Text>
      </Flex>
    );
  }

  return (
    <Flex vertical className="h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden">
      <Flex className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <MapViewer className="min-h-0 min-w-0 flex-1" flatEmbedChrome />
      </Flex>
    </Flex>
  );
};

export default EmbedPage;
