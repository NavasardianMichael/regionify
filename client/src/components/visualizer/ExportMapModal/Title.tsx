import { type FC } from 'react';
import { DownloadOutlined, ScissorOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

export type TitleVariant = 'export' | 'crop';

type TitleProps = {
  variant: TitleVariant;
};

export const Title: FC<TitleProps> = ({ variant }) => {
  const { t } = useTypedTranslation();
  const isCrop = variant === 'crop';

  return (
    <Flex align="center" gap="small">
      {isCrop ? (
        <ScissorOutlined className="text-primary" />
      ) : (
        <DownloadOutlined className="text-primary" />
      )}
      {isCrop ? (
        <Typography.Title
          level={4}
          className="mb-0!"
          data-i18n-key="visualizer.exportModal.cropAndDownload"
        >
          {t('visualizer.exportModal.cropAndDownload')}
        </Typography.Title>
      ) : (
        <Typography.Title level={4} className="mb-0!" data-i18n-key="visualizer.exportModal.title">
          {t('visualizer.exportModal.title')}
        </Typography.Title>
      )}
    </Flex>
  );
};
