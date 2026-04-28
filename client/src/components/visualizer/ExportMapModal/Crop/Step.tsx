import { type FC, useMemo } from 'react';
import { Cropper, ImageRestriction, Priority } from 'react-advanced-cropper';
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
        <div className="export-cropper-container h-100">
          <Cropper
            ref={cropperRef}
            src={previewSrc}
            onChange={handleCropChange}
            imageRestriction={ImageRestriction.fitArea}
            priority={Priority.coordinates}
            defaultCoordinates={(state: { imageSize: { width: number; height: number } }) => ({
              left: 0,
              top: 0,
              width: state.imageSize.width,
              height: state.imageSize.height,
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
        <Typography.Text
          className="text-sm text-gray-600"
          data-i18n-key="visualizer.exportModal.aspectRatioLabel"
        >
          {t('visualizer.exportModal.aspectRatioLabel')}
        </Typography.Text>
        <Segmented
          className="w-fit"
          value={aspectRatioPreset}
          onChange={(value: string) => handleAspectRatioChange(value as AspectRatioPreset)}
          options={aspectRatioOptions}
          disabled={isDisabled}
        />
      </Flex>

      <Flex vertical gap="small" className="mb-md!">
        <Typography.Text
          className="text-sm text-gray-600"
          data-i18n-key="visualizer.exportModal.resolutionLabel"
        >
          {t('visualizer.exportModal.resolutionLabel')}
        </Typography.Text>
        <Flex gap="small" align="center">
          <Flex align="center" gap="small">
            <Typography.Text
              className="text-xs text-gray-500"
              data-i18n-key="visualizer.exportModal.width"
            >
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
            <Typography.Text
              className="text-xs text-gray-500"
              data-i18n-key="visualizer.exportModal.height"
            >
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
