import type { FC } from 'react';
import { Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

const HomePage: FC = () => {
  const { t } = useTypedTranslation();
  return (
    <Flex vertical gap="middle">
      <Typography.Title level={1} className="text-primary text-3xl font-bold">
        {t('home.title')}
      </Typography.Title>
      <Typography.Paragraph className="text-gray-600">{t('home.welcome')}</Typography.Paragraph>
    </Flex>
  );
};

export default HomePage;
