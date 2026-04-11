import type { FC } from 'react';
import { CameraOutlined, HistoryOutlined } from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import { Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type DataModeCard = {
  Icon: React.ForwardRefExoticComponent<
    Omit<AntdIconProps, 'ref'> & React.RefAttributes<HTMLSpanElement>
  >;
  title: string;
  description: string;
};

export const DataModesSection: FC = () => {
  const { t } = useTypedTranslation();

  const modes: DataModeCard[] = [
    {
      Icon: CameraOutlined,
      title: t('home.dataModesStaticTitle'),
      description: t('home.dataModesStaticDesc'),
    },
    {
      Icon: HistoryOutlined,
      title: t('home.dataModesTimeSeriesTitle'),
      description: t('home.dataModesTimeSeriesDesc'),
    },
  ];

  return (
    <section className="bg-white px-6 py-16 md:py-20">
      <div className="mx-auto w-full max-w-5xl">
        <Flex vertical gap="large">
          <Flex vertical gap="small" align="center" className="text-center">
            <Typography.Title
              level={2}
              className="text-primary mb-0! text-2xl font-bold md:text-3xl"
            >
              {t('home.dataModesTitle')}
            </Typography.Title>
            <Typography.Paragraph className="mb-0! text-gray-500">
              {t('home.dataModesSubtitle')}
            </Typography.Paragraph>
          </Flex>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {modes.map(({ Icon, title, description }) => (
              <Flex key={title} vertical gap="small" className="p-6">
                <Icon className="text-primary text-3xl" />
                <Typography.Title level={3} className="mb-0! text-lg! font-semibold">
                  {title}
                </Typography.Title>
                <Typography.Paragraph className="mb-0! text-gray-500">
                  {description}
                </Typography.Paragraph>
              </Flex>
            ))}
          </div>
        </Flex>
      </div>
    </section>
  );
};
