import type { FC } from 'react';
import { Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

const AboutPage: FC = () => {
  const { t } = useTypedTranslation();
  return (
    <Flex vertical gap="middle">
      <Typography.Title level={1} className="text-primary text-2xl font-bold md:text-3xl">
        {t('about.title')}
      </Typography.Title>
      <Typography.Paragraph className="text-gray-600">
        {t('about.description')}
      </Typography.Paragraph>
    </Flex>
  );
};

export default AboutPage;
