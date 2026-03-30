import { type FC } from 'react';
import { Cropper } from 'react-advanced-cropper';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button, Flex, InputNumber, Segmented, Spin, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import {
  ASPECT_RATIO_OPTIONS,
  type AspectRatioPreset,
  type ExportCropState,
} from './useExportCrop';
import 'react-advanced-cropper/dist/style.css';

type Props = {
  crop: ExportCropState;
  isExporting: boolean;
  downloadButtonLabel: string;
  onBack: () => void;
  onDownload: () => void;
};

export const ExportCropStep: FC<Props> = ({
  crop,
  isExporting,
  downloadButtonLabel,
  onBack,
  onDownload,
}) => {
  const { t } = useTypedTranslation();
  const {
    cropperRef,
    previewSrc,
    isGeneratingPreview,
    aspectRatioPreset,
    aspectRatio,
    cropWidth,
    cropHeight,
    imageSize,
    handleCropChange,
    handleAspectRatioChange,
    handleWidthChange,
    handleHeightChange,
  } = crop;
  const isDisabled = isExporting || isGeneratingPreview;

  return (
    <Flex vertical gap="middle" className="py-md">
      {isGeneratingPreview ? (
        <Flex justify="center" align="center" className="h-80">
          <Spin size="large" />
        </Flex>
      ) : previewSrc ? (
        <div className="export-cropper-container" style={{ height: 400 }}>
          <Cropper
            ref={cropperRef}
            src={previewSrc}
            onChange={handleCropChange}
            imageRestriction="fitArea"
            defaultSize={({ imageSize }: { imageSize: { width: number; height: number } }) => ({
              width: imageSize.width * 0.92,
              height: imageSize.height * 0.92,
            })}
            stencilProps={{
              aspectRatio,
              movable: !isDisabled,
              resizable: !isDisabled,
            }}
            className="export-cropper"
          />
        </div>
      ) : null}

      <Flex vertical gap="small">
        <Typography.Text className="text-sm text-gray-600">
          {t('visualizer.exportModal.aspectRatioLabel')}
        </Typography.Text>
        <Segmented
          value={aspectRatioPreset}
          onChange={(value: string) => handleAspectRatioChange(value as AspectRatioPreset)}
          options={ASPECT_RATIO_OPTIONS}
          block
          disabled={isDisabled}
        />
      </Flex>

      <Flex vertical gap="small">
        <Typography.Text className="text-sm text-gray-600">
          {t('visualizer.exportModal.outputSizeLabel')}
        </Typography.Text>
        <Flex gap="small" align="center">
          <Flex align="center" gap="small">
            <Typography.Text className="text-xs text-gray-500">
              {t('visualizer.exportModal.width')}
            </Typography.Text>
            <InputNumber
              min={1}
              max={imageSize?.width}
              value={cropWidth}
              onChange={handleWidthChange}
              disabled={isDisabled}
            />
          </Flex>
          <Typography.Text className="text-xs text-gray-400">×</Typography.Text>
          <Flex align="center" gap="small">
            <Typography.Text className="text-xs text-gray-500">
              {t('visualizer.exportModal.height')}
            </Typography.Text>
            <InputNumber
              min={1}
              max={imageSize?.height}
              value={cropHeight}
              onChange={handleHeightChange}
              disabled={isDisabled}
            />
          </Flex>
        </Flex>
      </Flex>

      <Flex justify="space-between" className="mt-sm">
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} disabled={isDisabled}>
          {t('visualizer.exportModal.back')}
        </Button>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={onDownload}
          loading={isExporting}
          disabled={isDisabled || !previewSrc}
        >
          {downloadButtonLabel}
        </Button>
      </Flex>
    </Flex>
  );
};
