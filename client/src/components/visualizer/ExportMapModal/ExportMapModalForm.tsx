import { type FC } from 'react';
import { DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
  Button,
  Flex,
  InputNumber,
  Progress,
  Select,
  Slider,
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { getAnimationTotalFrames } from '@/helpers/animationExport';
import { AppNavLink } from '@/components/ui/AppNavLink';
import { EXPORT_FPS, type ExportMapModalFormProps } from './useExportMapModal';

export const ExportMapModalForm: FC<ExportMapModalFormProps> = (props) => {
  const { t } = useTypedTranslation();
  const {
    exportType,
    defaultExportType,
    exportTypeOptions,
    exportTypeInfoTooltip,
    quality,
    resolvedQuality,
    secondsPerPeriod,
    resolvedSecondsPerPeriod,
    smoothTransitions,
    setSmoothTransitions,
    isExporting,
    progress,
    isAnimationFormat,
    hasTimelineData,
    selectedCountryId,
    allowedFormats,
    limits,
    maxQuality,
    timePeriods,
    handleExportTypeChange,
    handleQualityInputChange,
    handleQualitySliderChange,
    handleQualityBlur,
    handleSecondsInputChange,
    handleSecondsBlur,
    handleDownload,
    showQualityControl,
    downloadButtonLabel,
  } = props;

  return (
    <Flex vertical gap="middle" className="py-md">
      <Flex vertical gap="small">
        <Flex align="center" gap="small">
          <Typography.Text className="text-sm text-gray-600">Export type:</Typography.Text>
          {exportTypeInfoTooltip && (
            <Tooltip title={exportTypeInfoTooltip}>
              <InfoCircleOutlined className="cursor-help text-gray-400" />
            </Tooltip>
          )}
        </Flex>
        <Select
          value={
            exportTypeOptions.some((o) => o.value === exportType) ? exportType : defaultExportType
          }
          onChange={handleExportTypeChange}
          options={exportTypeOptions}
          className="w-full"
          disabled={isExporting}
        />
        {allowedFormats.length === 1 && (
          <Typography.Text type="secondary" className="text-xs">
            <AppNavLink to={ROUTES.BILLING} className="text-primary! font-semibold">
              {t('visualizer.exportModal.upgradeToExplorer')}
            </AppNavLink>
            {t('visualizer.exportModal.singleFormatHintAfterLink')}
          </Typography.Text>
        )}
      </Flex>

      {showQualityControl && (
        <Flex vertical gap="small">
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Quality (%):</Typography.Text>
            <InputNumber
              min={1}
              max={maxQuality}
              value={quality}
              onChange={handleQualityInputChange}
              onBlur={handleQualityBlur}
              className="w-20"
              disabled={isExporting}
            />
          </Flex>
          <Slider
            min={1}
            max={100}
            value={quality ?? resolvedQuality}
            onChange={handleQualitySliderChange}
            aria-label="Export quality"
            disabled={isExporting}
          />
          {limits.pictureQualityLimit && (
            <Typography.Text type="secondary" className="text-xs">
              {t('visualizer.exportModal.qualityLimited', { max: maxQuality })}{' '}
              <AppNavLink to={ROUTES.BILLING} className="text-primary! font-semibold">
                {t('visualizer.exportModal.upgradeToExplorer')}
              </AppNavLink>
              {t('visualizer.exportModal.qualityFullHint')}
            </Typography.Text>
          )}
        </Flex>
      )}

      {isAnimationFormat && hasTimelineData && (
        <Flex vertical gap="small">
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">
              Seconds per time period:
            </Typography.Text>
            <InputNumber
              min={0.5}
              max={10}
              step={0.5}
              value={secondsPerPeriod}
              onChange={handleSecondsInputChange}
              onBlur={handleSecondsBlur}
              className="w-20"
              disabled={isExporting}
            />
          </Flex>
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Smooth transitions:</Typography.Text>
            <Switch
              checked={smoothTransitions}
              onChange={setSmoothTransitions}
              aria-label="Smooth transitions between time periods"
              disabled={isExporting}
            />
          </Flex>
          <Typography.Text type="secondary" className="text-xs">
            {getAnimationTotalFrames(timePeriods.length, {
              secondsPerPeriod: resolvedSecondsPerPeriod,
              fps: EXPORT_FPS,
            })}{' '}
            frames · ~
            {(
              getAnimationTotalFrames(timePeriods.length, {
                secondsPerPeriod: resolvedSecondsPerPeriod,
                fps: EXPORT_FPS,
              }) / EXPORT_FPS
            ).toFixed(1)}
            s duration
          </Typography.Text>
        </Flex>
      )}

      {isExporting && isAnimationFormat && (
        <Progress percent={Math.round(progress * 100)} status="active" strokeColor="#18294D" />
      )}

      <Button
        type="primary"
        icon={<DownloadOutlined />}
        onClick={handleDownload}
        loading={isExporting}
        disabled={isExporting || !selectedCountryId || (isAnimationFormat && !hasTimelineData)}
      >
        {downloadButtonLabel}
      </Button>
    </Flex>
  );
};
