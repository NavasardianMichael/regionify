import { type FC } from 'react';
import { NavLink } from 'react-router-dom';
import { DownloadOutlined, InfoCircleOutlined, RightOutlined } from '@ant-design/icons';
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
import { EXPORT_FPS, type FormProps } from '../useExportMapModal';

export const Form: FC<FormProps> = (props) => {
  const { t } = useTypedTranslation();
  const explorerUpgradeLabel = t('visualizer.exportModal.upgradeToExplorer', {
    badgeName: t('badges.items.explorer.name'),
  });
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
    isSvgFormat,
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
    handleNext,
    showQualityControl,
    downloadButtonLabel,
  } = props;

  return (
    <Flex vertical gap="middle" className="py-md min-w-0 px-1">
      <Flex vertical gap="small">
        <Flex align="center" gap="small">
          <Typography.Text
            className="text-sm text-gray-600"
            data-i18n-key="visualizer.exportModal.exportTypeLabel"
          >
            {t('visualizer.exportModal.exportTypeLabel')}
          </Typography.Text>
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
          <Typography.Text
            type="secondary"
            className="text-xs"
            data-i18n-key="visualizer.exportModal.singleFormatHintAfterLink"
          >
            <AppNavLink to={ROUTES.BILLING} className="text-primary! font-semibold">
              {explorerUpgradeLabel}
            </AppNavLink>
            {t('visualizer.exportModal.singleFormatHintAfterLink')}
          </Typography.Text>
        )}
      </Flex>

      {showQualityControl && (
        <Flex vertical gap="small" className="min-w-0">
          <Flex align="center" justify="space-between" gap="small" className="min-w-0">
            <Flex align="center" gap="small" className="min-w-0 flex-1">
              <Typography.Text
                className="min-w-0 truncate text-sm text-gray-600"
                data-i18n-key="visualizer.exportModal.qualityLabel"
              >
                {t('visualizer.exportModal.qualityLabel')}
              </Typography.Text>
              {limits.pictureQualityLimit && (
                <Tooltip
                  title={
                    <span>
                      {t('visualizer.exportModal.qualityLimited', { max: maxQuality })}{' '}
                      <NavLink
                        to={ROUTES.BILLING}
                        className="text-white! underline! underline-offset-2! hover:text-white!"
                      >
                        {explorerUpgradeLabel}
                      </NavLink>
                      {t('visualizer.exportModal.qualityFullHint')}
                    </span>
                  }
                >
                  <InfoCircleOutlined className="shrink-0 cursor-help text-gray-400" />
                </Tooltip>
              )}
            </Flex>
            <InputNumber
              min={1}
              max={maxQuality}
              value={quality}
              onChange={handleQualityInputChange}
              onBlur={handleQualityBlur}
              className="w-20 shrink-0"
              disabled={isExporting}
            />
          </Flex>
          {/* Inset so slider handles at 1 / max do not extend past the modal content (Ant Design handle overhang). */}
          <div className="min-w-0 px-2.5">
            <Slider
              min={1}
              max={maxQuality}
              value={quality ?? resolvedQuality}
              onChange={handleQualitySliderChange}
              aria-label="Export quality"
              disabled={isExporting}
              styles={{
                root: { marginInline: 0, width: '100%' },
              }}
            />
          </div>
        </Flex>
      )}

      {isAnimationFormat && hasTimelineData && (
        <Flex vertical gap="small">
          <Flex align="center" justify="space-between">
            <Typography.Text
              className="text-sm text-gray-600"
              data-i18n-key="visualizer.exportModal.secondsPerPeriod"
            >
              {t('visualizer.exportModal.secondsPerPeriod')}
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
            <Typography.Text
              className="text-sm text-gray-600"
              data-i18n-key="visualizer.exportModal.smoothTransitions"
            >
              {t('visualizer.exportModal.smoothTransitions')}
            </Typography.Text>
            <Switch
              checked={smoothTransitions}
              onChange={setSmoothTransitions}
              aria-label="Smooth transitions between time periods"
              disabled={isExporting}
            />
          </Flex>
          <Typography.Text
            type="secondary"
            className="text-xs"
            data-i18n-key="visualizer.exportModal.animationDuration"
          >
            {t('visualizer.exportModal.animationDuration', {
              frames: getAnimationTotalFrames(timePeriods.length, {
                secondsPerPeriod: resolvedSecondsPerPeriod,
                fps: EXPORT_FPS,
              }),
              seconds: (
                getAnimationTotalFrames(timePeriods.length, {
                  secondsPerPeriod: resolvedSecondsPerPeriod,
                  fps: EXPORT_FPS,
                }) / EXPORT_FPS
              ).toFixed(1),
            })}
          </Typography.Text>
        </Flex>
      )}

      {isExporting && isAnimationFormat && (
        <Progress percent={Math.round(progress * 100)} status="active" strokeColor="#18294D" />
      )}

      {isExporting && isSvgFormat && (
        <Typography.Text
          type="secondary"
          className="block w-full text-center text-sm"
          data-i18n-key="visualizer.exportModal.exportSvgBuilding"
        >
          {t('visualizer.exportModal.exportSvgBuilding')}
        </Typography.Text>
      )}

      {isSvgFormat ? (
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          loading={isExporting}
          disabled={isExporting || !selectedCountryId}
        >
          {downloadButtonLabel}
        </Button>
      ) : (
        <Button
          type="primary"
          icon={<RightOutlined />}
          iconPlacement="end"
          onClick={handleNext}
          disabled={isExporting || !selectedCountryId || (isAnimationFormat && !hasTimelineData)}
          data-i18n-key="visualizer.exportModal.nextCropAndDownload"
        >
          {t('visualizer.exportModal.nextCropAndDownload')}
        </Button>
      )}
    </Flex>
  );
};
