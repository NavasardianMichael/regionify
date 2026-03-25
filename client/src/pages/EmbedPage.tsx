import { type FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Flex, Spin, Typography } from 'antd';
import { fetchPublicEmbedData } from '@/api/embed';
import type { PublicEmbedApiResponse } from '@/api/embed/types';
import type { Project } from '@/api/projects/types';
import { useLoadProject } from '@/hooks/useLoadProject';
import { resetVisualizerToDefaultState } from '@/helpers/applyFullTemporaryProjectState';
import MapViewer from '@/components/visualizer/MapViewer';

function buildProjectFromEmbedPayload(data: PublicEmbedApiResponse): Project {
  return {
    id: '__embed__',
    name: '',
    countryId: data.countryId,
    dataset: data.dataset,
    mapStyles: data.mapStyles,
    legendStyles: data.legendStyles,
    legendData: data.legendData,
    embedEnabled: false,
    embedToken: null,
    embedSeoTitle: null,
    embedSeoDescription: null,
    embedSeoKeywords: null,
    createdAt: '',
    updatedAt: '',
  };
}

const EmbedPage: FC = () => {
  const { token } = useParams<{ token: string }>();
  const loadProject = useLoadProject();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('Invalid embed link');
      setLoading(false);
      return;
    }

    let cancelled = false;

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
          setError(e instanceof Error ? e.message : 'Failed to load map');
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
      <Flex align="center" justify="center" className="h-full min-h-[240px] w-full">
        <Spin size="large" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex
        vertical
        align="center"
        justify="center"
        gap="small"
        className="h-full min-h-[240px] w-full p-4"
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
    <Flex vertical className="h-full min-h-0 w-full gap-2 p-4">
      <Flex className="min-h-0 flex-1">
        <MapViewer className="min-h-0 flex-1" />
      </Flex>
      <Typography.Text type="secondary" className="shrink-0 text-center text-xs">
        Map by Regionify
      </Typography.Text>
    </Flex>
  );
};

export default EmbedPage;
