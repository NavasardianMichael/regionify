import { type FC, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { DownloadOutlined, InfoCircleOutlined, RightOutlined } from '@ant-design/icons';
import {
  Button,
  Flex,
  InputNumber,
  Progress,
  Radio,
  Select,
  Slider,
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { getAnimationTotalFrames } from '@/helpers/animationExport';
import type { PdfPageFormat } from '@/helpers/pdfExport';
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
    isPdfFormat,
    skipCropStep,
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
    pdfPageFormat,
    pdfOrientation,
    pdfPageFormatOptions,
    handlePdfPageFormatChange,
    handlePdfOrientationChange,
  } = props;

  const pdfFormatLabels = useMemo(
    (): Record<PdfPageFormat, string> => ({
      a4: t('visualizer.exportModal.pdfFormatA4'),
      a3: t('visualizer.exportModal.pdfFormatA3'),
      letter: t('visualizer.exportModal.pdfFormatLetter'),
      legal: t('visualizer.exportModal.pdfFormatLegal'),
    }),
    [t],
  );

  const localizedPdfFormatOptions = useMemo(
    () =>
      pdfPageFormatOptions.map((o) => ({
        value: o.value,
        label: pdfFormatLabels[o.value],
      })),
    [pdfPageFormatOptions, pdfFormatLabels],
  );

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

      {isPdfFormat && (
        <>
          <Flex vertical gap="small">
            <Typography.Text
              className="text-sm text-gray-600"
              data-i18n-key="visualizer.exportModal.pdfPageFormatLabel"
            >
              {t('visualizer.exportModal.pdfPageFormatLabel')}
            </Typography.Text>
            <Select<PdfPageFormat>
              value={pdfPageFormat}
              onChange={handlePdfPageFormatChange}
              options={localizedPdfFormatOptions}
              className="w-full"
              disabled={isExporting}
              aria-label={t('visualizer.exportModal.pdfPageFormatLabel')}
            />
          </Flex>
          <Flex vertical gap="small">
            <Typography.Text
              className="text-sm text-gray-600"
              data-i18n-key="visualizer.exportModal.pdfOrientationLabel"
            >
              {t('visualizer.exportModal.pdfOrientationLabel')}
            </Typography.Text>
            <Radio.Group
              value={pdfOrientation}
              onChange={handlePdfOrientationChange}
              optionType="default"
              disabled={isExporting}
              aria-label={t('visualizer.exportModal.pdfOrientationLabel')}
            >
              <Radio.Button
                value="portrait"
                data-i18n-key="visualizer.exportModal.pdfOrientationPortrait"
              >
                {t('visualizer.exportModal.pdfOrientationPortrait')}
              </Radio.Button>
              <Radio.Button
                value="landscape"
                data-i18n-key="visualizer.exportModal.pdfOrientationLandscape"
              >
                {t('visualizer.exportModal.pdfOrientationLandscape')}
              </Radio.Button>
            </Radio.Group>
          </Flex>
        </>
      )}

      {showQualityControl && (
        <Flex vertical className="min-w-0 gap-0!">
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
          <div className="min-w-0 pr-2.5">
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
        <>
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
                smooth: smoothTransitions,
              }),
              seconds: (timePeriods.length * resolvedSecondsPerPeriod).toFixed(1),
            })}
          </Typography.Text>
        </>
      )}

      {isExporting && isAnimationFormat && (
        <Progress percent={Math.round(progress * 100)} status="active" strokeColor="#18294D" />
      )}

      {isExporting && isPdfFormat && hasTimelineData && (
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

      {isExporting && isPdfFormat && !hasTimelineData && (
        <Typography.Text
          type="secondary"
          className="block w-full text-center text-sm"
          data-i18n-key="visualizer.exportModal.exportPdfBuilding"
        >
          {t('visualizer.exportModal.exportPdfBuilding')}
        </Typography.Text>
      )}

      {skipCropStep ? (
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          loading={isExporting}
          disabled={isExporting || !selectedCountryId || (isAnimationFormat && !hasTimelineData)}
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
