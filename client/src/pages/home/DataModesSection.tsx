import type { FC } from 'react';
import { CameraOutlined, HistoryOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

export const DataModesSection: FC = () => {
  const { t } = useTypedTranslation();

  return (
    <section className="bg-gray-50 px-6 py-16 md:py-20">
      <div className="mx-auto w-full max-w-5xl">
        <Flex vertical gap="large">
          <Flex vertical gap="small" align="center" className="text-center">
            <Typography.Title
              level={2}
              className="text-primary mb-0! text-2xl font-bold md:text-3xl"
              data-i18n-key="home.dataModesTitle"
            >
              {t('home.dataModesTitle')}
            </Typography.Title>
            <Typography.Paragraph
              className="mb-0! text-gray-500"
              data-i18n-key="home.dataModesSubtitle"
            >
              {t('home.dataModesSubtitle')}
            </Typography.Paragraph>
          </Flex>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <Flex key="static" vertical gap="small" className="p-6">
              <CameraOutlined className="text-primary text-3xl" />
              <Typography.Title
                level={3}
                className="mb-0! text-lg! font-semibold"
                data-i18n-key="home.dataModesStaticTitle"
              >
                {t('home.dataModesStaticTitle')}
              </Typography.Title>
              <Typography.Paragraph
                className="mb-0! text-gray-500"
                data-i18n-key="home.dataModesStaticDesc"
              >
                {t('home.dataModesStaticDesc')}
              </Typography.Paragraph>
            </Flex>
            <Flex key="timeSeries" vertical gap="small" className="p-6">
              <HistoryOutlined className="text-primary text-3xl" />
              <Typography.Title
                level={3}
                className="mb-0! text-lg! font-semibold"
                data-i18n-key="home.dataModesTimeSeriesTitle"
              >
                {t('home.dataModesTimeSeriesTitle')}
              </Typography.Title>
              <Typography.Paragraph
                className="mb-0! text-gray-500"
                data-i18n-key="home.dataModesTimeSeriesDesc"
              >
                {t('home.dataModesTimeSeriesDesc')}
              </Typography.Paragraph>
            </Flex>
          </div>
        </Flex>
      </div>
    </section>
  );
};
