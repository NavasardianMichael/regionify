import { type FC, useMemo } from 'react';
import { Cropper, ImageRestriction } from 'react-advanced-cropper';
import { Flex, InputNumber, Segmented, Spin, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import {
  ASPECT_RATIO_OPTIONS,
  type AspectRatioPreset,
  type ExportCropState,
} from './useExportCrop';
import 'react-advanced-cropper/dist/style.css';

type Props = {
  crop: ExportCropState;
};

export const Step: FC<Props> = ({ crop }) => {
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
  const isDisabled = isGeneratingPreview;

  const aspectRatioOptions = useMemo(
    () =>
      ASPECT_RATIO_OPTIONS.map((option) =>
        option.value === 'free'
          ? { ...option, label: t('visualizer.exportModal.aspectRatioPresetFree') }
          : option,
      ),
    [t],
  );

  return (
    <Flex vertical gap="middle" className="pt-md pb-md">
      {isGeneratingPreview ? (
        <Flex justify="center" align="center" className="h-80">
          <Spin size="large" />
        </Flex>
      ) : previewSrc ? (
        <div className="export-cropper-container h-[400px]">
          <Cropper
            ref={cropperRef}
            src={previewSrc}
            onChange={handleCropChange}
            imageRestriction={ImageRestriction.fitArea}
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
          options={aspectRatioOptions}
          block
          disabled={isDisabled}
        />
      </Flex>

      <Flex vertical gap="small">
        <Typography.Text className="text-sm text-gray-600">
          {t('visualizer.exportModal.resolutionLabel')}
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
    </Flex>
  );
};
