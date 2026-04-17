import { type FC, useMemo } from 'react';
import { Flex, Spin, Typography } from 'antd';
import { useMapThumbnail } from '@/hooks/useMapThumbnail';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type MapEntry = { regionId: string; label: string };

type MapThumbnailItemProps = { regionId: string; label: string };

const MapThumbnailItem: FC<MapThumbnailItemProps> = ({ regionId, label }) => {
  const { url, isLoading } = useMapThumbnail(regionId);
  return (
    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white p-3">
      {isLoading && <Spin size="small" />}
      {url && <img src={url} alt={label} className="h-full w-full object-contain" />}
    </div>
  );
};

export const MapsSection: FC = () => {
  const { t } = useTypedTranslation();

  const maps = useMemo<MapEntry[]>(
    () => [
      { regionId: 'europe', label: 'Europe' },
      { regionId: 'africa', label: 'Africa' },
      { regionId: 'asia', label: 'Asia' },
      { regionId: 'northAmerica', label: 'North America' },
      { regionId: 'southAmerica', label: 'South America' },
      { regionId: 'usa', label: 'USA' },
      { regionId: 'germany', label: 'Germany' },
      { regionId: 'france', label: 'France' },
      { regionId: 'brazil', label: 'Brazil' },
      { regionId: 'china', label: 'China' },
      { regionId: 'australia', label: 'Australia' },
      { regionId: 'unitedKingdom', label: 'United Kingdom' },
    ],
    [],
  );

  return (
    <section className="bg-gray-50 px-6 py-16 md:py-20">
      <div className="mx-auto w-full max-w-5xl">
        <Flex vertical gap="large">
          <Flex vertical gap="small" align="center" className="text-center">
            <Typography.Title
              level={2}
              className="text-primary mb-0! text-2xl font-bold md:text-3xl"
              data-i18n-key="home.mapsTitle"
            >
              {t('home.mapsTitle')}
            </Typography.Title>
            <Typography.Paragraph className="mb-0! text-gray-500" data-i18n-key="home.mapsSubtitle">
              {t('home.mapsSubtitle')}
            </Typography.Paragraph>
          </Flex>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {maps.map(({ regionId, label }) => (
              <MapThumbnailItem key={regionId} regionId={regionId} label={label} />
            ))}
          </div>
        </Flex>
      </div>
    </section>
  );
};
