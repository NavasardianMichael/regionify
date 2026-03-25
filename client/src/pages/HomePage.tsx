import type { FC } from 'react';
import { Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

const HomePage: FC = () => {
  const { t } = useTypedTranslation();
  return (
    <Flex vertical className="h-full min-h-0 w-full flex-col items-center">
      <Flex vertical gap="middle" className="w-full max-w-4xl p-6">
        <Typography.Title level={1} className="text-primary mb-0! text-3xl font-bold">
          {t('home.title')}
        </Typography.Title>
        <Typography.Paragraph className="mb-0! text-gray-600">
          {t('home.welcome')}
        </Typography.Paragraph>
      </Flex>
    </Flex>
  );
};

export default HomePage;
