import { type FC, useMemo } from 'react';
import {
  BgColorsOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import { Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type FeatureItem = {
  Icon: React.ForwardRefExoticComponent<
    Omit<AntdIconProps, 'ref'> & React.RefAttributes<HTMLSpanElement>
  >;
  title: string;
  desc: string;
};

export const FeaturesSection: FC = () => {
  const { t } = useTypedTranslation();

  const features = useMemo<FeatureItem[]>(
    () => [
      {
        Icon: CloudUploadOutlined,
        title: t('home.featureImportTitle'),
        desc: t('home.featureImportDesc'),
      },
      {
        Icon: BgColorsOutlined,
        title: t('home.featureCustomizeTitle'),
        desc: t('home.featureCustomizeDesc'),
      },
      {
        Icon: DownloadOutlined,
        title: t('home.featureExportTitle'),
        desc: t('home.featureExportDesc'),
      },
      {
        Icon: HistoryOutlined,
        title: t('home.featureTimeSeriesTitle'),
        desc: t('home.featureTimeSeriesDesc'),
      },
    ],
    [t],
  );

  return (
    <section className="bg-white px-6 py-16 md:py-20">
      <div className="mx-auto w-full max-w-5xl">
        <Flex vertical gap="large">
          <Typography.Title
            level={2}
            className="text-primary mb-0! text-center text-2xl font-bold md:text-3xl"
          >
            {t('home.featuresTitle')}
          </Typography.Title>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ Icon, title, desc }) => (
              <Flex key={title} vertical gap="small" align="center" className="text-center">
                <Icon className="text-primary mb-sm text-4xl" />
                <Typography.Title level={3} className="mb-0! text-base! font-semibold">
                  {title}
                </Typography.Title>
                <Typography.Paragraph className="mb-0! text-gray-500">{desc}</Typography.Paragraph>
              </Flex>
            ))}
          </div>
        </Flex>
      </div>
    </section>
  );
};
