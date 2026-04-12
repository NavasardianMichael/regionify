import { type FC, useMemo } from 'react';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type FooterProps = {
  disabled: boolean;
  downloadDisabled: boolean;
  isExporting: boolean;
  downloadLabel: string;
  exportProgress: number;
  totalAnimationFrames: number;
  isAnimationFormat: boolean;
  onBack: () => void;
  onDownload: () => void;
};

export const Footer: FC<FooterProps> = ({
  disabled,
  downloadDisabled,
  isExporting,
  downloadLabel,
  exportProgress,
  totalAnimationFrames,
  isAnimationFormat,
  onBack,
  onDownload,
}) => {
  const { t } = useTypedTranslation();

  const processedFrames = useMemo(() => {
    if (totalAnimationFrames <= 0) return 0;
    return Math.min(
      totalAnimationFrames,
      Math.max(0, Math.round(exportProgress * totalAnimationFrames)),
    );
  }, [exportProgress, totalAnimationFrames]);

  const showFrameProgress = isExporting && isAnimationFormat && totalAnimationFrames > 0;

  return (
    <Flex vertical gap="small" className="w-full">
      <Flex justify="space-between" align="center" className="w-full" wrap="wrap" gap="small">
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} disabled={disabled}>
          {t('visualizer.exportModal.back')}
        </Button>
        {showFrameProgress && (
          <Typography.Text type="secondary" className="min-w-28 text-center text-sm">
            {t('visualizer.exportModal.exportFramesProcessed', {
              processed: processedFrames,
              total: totalAnimationFrames,
            })}
          </Typography.Text>
        )}
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
    </Flex>
  );
};
