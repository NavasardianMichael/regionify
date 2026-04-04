import { type FC } from 'react';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type ExportMapModalCropFooterProps = {
  disabled: boolean;
  downloadDisabled: boolean;
  isExporting: boolean;
  downloadLabel: string;
  onBack: () => void;
  onDownload: () => void;
};

export const ExportMapModalCropFooter: FC<ExportMapModalCropFooterProps> = ({
  disabled,
  downloadDisabled,
  isExporting,
  downloadLabel,
  onBack,
  onDownload,
}) => {
  const { t } = useTypedTranslation();

  return (
    <Flex justify="space-between" align="center" className="w-full" wrap="wrap" gap="small">
      <Button icon={<ArrowLeftOutlined />} onClick={onBack} disabled={disabled}>
        {t('visualizer.exportModal.back')}
      </Button>
      <Button
        type="primary"
        icon={<DownloadOutlined />}
        onClick={onDownload}
        loading={isExporting}
        disabled={disabled || downloadDisabled}
      >
        {downloadLabel}
      </Button>
    </Flex>
  );
};
