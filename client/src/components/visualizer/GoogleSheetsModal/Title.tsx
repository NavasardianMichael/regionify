import { type FC } from 'react';
import { LinkOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

export const Title: FC = () => {
  const { t } = useTypedTranslation();
  return (
    <Flex align="center" gap="small" className="mb-4!">
      <LinkOutlined className="text-primary" />
      <Typography.Title level={4} className="mb-0!" data-i18n-key="visualizer.googleSheets.title">
        {t('visualizer.googleSheets.title')}
      </Typography.Title>
    </Flex>
  );
};
