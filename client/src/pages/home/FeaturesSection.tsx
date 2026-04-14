import { type FC } from 'react';
import {
  BgColorsOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

export const FeaturesSection: FC = () => {
  const { t } = useTypedTranslation();

  return (
    <section className="bg-gray-50 px-6 py-16 md:py-20">
      <div className="mx-auto w-full max-w-5xl">
        <Flex vertical gap="large">
          <Typography.Title
            level={2}
            className="text-primary mb-0! text-center text-2xl font-bold md:text-3xl"
            data-i18n-key="home.featuresTitle"
          >
            {t('home.featuresTitle')}
          </Typography.Title>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <Flex key="import" vertical gap="small" align="center" className="text-center">
              <CloudUploadOutlined className="text-primary mb-sm text-4xl" />
              <Typography.Title
                level={3}
                className="mb-0! text-base! font-semibold"
                data-i18n-key="home.featureImportTitle"
              >
                {t('home.featureImportTitle')}
              </Typography.Title>
              <Typography.Paragraph
                className="mb-0! text-gray-500"
                data-i18n-key="home.featureImportDesc"
              >
                {t('home.featureImportDesc')}
              </Typography.Paragraph>
            </Flex>
            <Flex key="customize" vertical gap="small" align="center" className="text-center">
              <BgColorsOutlined className="text-primary mb-sm text-4xl" />
              <Typography.Title
                level={3}
                className="mb-0! text-base! font-semibold"
                data-i18n-key="home.featureCustomizeTitle"
              >
                {t('home.featureCustomizeTitle')}
              </Typography.Title>
              <Typography.Paragraph
                className="mb-0! text-gray-500"
                data-i18n-key="home.featureCustomizeDesc"
              >
                {t('home.featureCustomizeDesc')}
              </Typography.Paragraph>
            </Flex>
            <Flex key="export" vertical gap="small" align="center" className="text-center">
              <DownloadOutlined className="text-primary mb-sm text-4xl" />
              <Typography.Title
                level={3}
                className="mb-0! text-base! font-semibold"
                data-i18n-key="home.featureExportTitle"
              >
                {t('home.featureExportTitle')}
              </Typography.Title>
              <Typography.Paragraph
                className="mb-0! text-gray-500"
                data-i18n-key="home.featureExportDesc"
              >
                {t('home.featureExportDesc')}
              </Typography.Paragraph>
            </Flex>
            <Flex key="timeSeries" vertical gap="small" align="center" className="text-center">
              <HistoryOutlined className="text-primary mb-sm text-4xl" />
              <Typography.Title
                level={3}
                className="mb-0! text-base! font-semibold"
                data-i18n-key="home.featureTimeSeriesTitle"
              >
                {t('home.featureTimeSeriesTitle')}
              </Typography.Title>
              <Typography.Paragraph
                className="mb-0! text-gray-500"
                data-i18n-key="home.featureTimeSeriesDesc"
              >
                {t('home.featureTimeSeriesDesc')}
              </Typography.Paragraph>
            </Flex>
          </div>
        </Flex>
      </div>
    </section>
  );
};
