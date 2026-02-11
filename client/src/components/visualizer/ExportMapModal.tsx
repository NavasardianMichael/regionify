import { type FC, useCallback, useMemo, useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { EXPORT_TYPES, type ExportType, PLAN_DETAILS, PLANS } from '@regionify/shared';
import {
  Button,
  Flex,
  InputNumber,
  message,
  Modal,
  Progress,
  Select,
  Slider,
  Typography,
} from 'antd';
import { useShallow } from 'zustand/react/shallow';
import { selectItemsList } from '@/store/legendData/selectors';
import { useLegendDataStore } from '@/store/legendData/store';
import { selectNoDataColor } from '@/store/legendStyles/selectors';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import {
  selectHasTimelineData,
  selectSelectedRegionId,
  selectTimelineData,
  selectTimePeriods,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { selectBorder, selectPicture, selectShadow } from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';
import { exportAnimationAsGif, exportAnimationAsVideo } from '@/helpers/animationExport';
import { exportMapAsJpeg, exportMapAsPng, exportMapAsSvg } from '@/helpers/mapExport';
import { loadMapSvg } from '@/helpers/mapLoader';
import { AppNavLink } from '@/components/ui/AppNavLink';

type ExportTypeOption = {
  value: ExportType;
  label: string;
};

const ALL_EXPORT_OPTIONS: ExportTypeOption[] = [
  { value: EXPORT_TYPES.png, label: 'PNG' },
  { value: EXPORT_TYPES.svg, label: 'SVG' },
  { value: EXPORT_TYPES.jpeg, label: 'JPEG' },
  { value: EXPORT_TYPES.gif, label: 'GIF (Animation)' },
  { value: EXPORT_TYPES.mp4, label: 'Video (MP4/WebM)' },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

const DEFAULT_QUALITY = 60;

const ExportMapModal: FC<Props> = ({ open, onClose }) => {
  const selectedRegionId = useVisualizerStore(selectSelectedRegionId);
  const hasTimelineData = useVisualizerStore(selectHasTimelineData);
  const timePeriods = useVisualizerStore(selectTimePeriods);
  const timelineData = useVisualizerStore(selectTimelineData);

  const user = useProfileStore(selectUser);
  const plan = user?.plan ?? PLANS.observer;
  const { limits } = PLAN_DETAILS[plan];

  const legendItems = useLegendDataStore(useShallow(selectItemsList));
  const noDataColor = useLegendStylesStore(selectNoDataColor);
  const border = useMapStylesStore(selectBorder);
  const shadow = useMapStylesStore(selectShadow);
  const picture = useMapStylesStore(selectPicture);
  const maxQuality = limits.maxExportQuality;
  const initialQuality = Math.min(DEFAULT_QUALITY, maxQuality);
  const allowedFormats = limits.allowedExportFormats;
  const exportTypeOptions = useMemo(
    () => ALL_EXPORT_OPTIONS.filter((o) => allowedFormats.includes(o.value)),
    [allowedFormats],
  );
  const defaultExportType = allowedFormats[0] ?? EXPORT_TYPES.png;

  const [exportType, setExportType] = useState<ExportType>(defaultExportType);
  const [quality, setQuality] = useState(initialQuality);
  const [fps, setFps] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const isAnimationFormat = exportType === EXPORT_TYPES.gif || exportType === EXPORT_TYPES.mp4;

  const handleAfterOpenChange = useCallback(
    (visible: boolean) => {
      if (visible) {
        setExportType(defaultExportType);
        setQuality(Math.min(DEFAULT_QUALITY, maxQuality));
      }
    },
    [defaultExportType, maxQuality],
  );

  const handleExportTypeChange = useCallback((value: ExportType) => {
    setExportType(value);
  }, []);

  const handleQualityChange = useCallback(
    (value: number | null) => {
      const v = value ?? initialQuality;
      setQuality(Math.min(v, maxQuality));
    },
    [initialQuality, maxQuality],
  );

  const exportHandlers = useMemo(
    () => ({
      [EXPORT_TYPES.svg]: (fileName: string) => exportMapAsSvg(fileName),
      [EXPORT_TYPES.png]: (fileName: string) => {
        if (plan === PLANS.observer) {
          return exportMapAsPng(quality, fileName, {
            backgroundColor: '#f5f5f5',
            watermark: 'Regionify',
          });
        }
        return exportMapAsPng(quality, fileName);
      },
      [EXPORT_TYPES.jpeg]: (fileName: string) => {
        if (plan === PLANS.observer) {
          return exportMapAsJpeg(quality, fileName, {
            backgroundColor: '#f5f5f5',
            watermark: 'Regionify',
          });
        }
        return exportMapAsJpeg(quality, fileName);
      },
    }),
    [quality, plan],
  );

  const handleDownload = useCallback(async () => {
    const fileName = selectedRegionId ? `regionify-${selectedRegionId}` : 'regionify-map';

    setIsExporting(true);
    setProgress(0);
    try {
      if (isAnimationFormat) {
        if (!hasTimelineData) {
          message.warning('Import historical data with a time column first to export animations.');
          return;
        }
        const rawSvg = await loadMapSvg(selectedRegionId!);
        if (!rawSvg) throw new Error('Failed to load map SVG');

        const exportOptions = {
          rawSvg,
          timePeriods,
          timelineData,
          legendItems,
          noDataColor,
          border,
          shadow,
          picture,
          quality,
          fps,
          onProgress: setProgress,
        };

        if (exportType === EXPORT_TYPES.gif) {
          await exportAnimationAsGif(exportOptions);
        } else {
          await exportAnimationAsVideo(exportOptions);
        }
      } else {
        const handler = exportHandlers[exportType as keyof typeof exportHandlers];
        if (!handler) return;
        await handler(fileName);
      }
      message.success(`Map exported as ${exportType.toUpperCase()}`);
      onClose();
    } catch {
      message.error('Failed to export. Please try again.');
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [
    exportType,
    isAnimationFormat,
    hasTimelineData,
    selectedRegionId,
    exportHandlers,
    timePeriods,
    timelineData,
    legendItems,
    noDataColor,
    border,
    shadow,
    picture,
    quality,
    fps,
    onClose,
  ]);

  const showQualityControl = useMemo(() => {
    return exportType === EXPORT_TYPES.png || exportType === EXPORT_TYPES.jpeg || isAnimationFormat;
  }, [exportType, isAnimationFormat]);

  const downloadButtonLabel = useMemo(() => {
    if (exportType === EXPORT_TYPES.gif) return 'Download GIF';
    if (exportType === EXPORT_TYPES.mp4) return 'Download Video';
    return `Download ${exportType.toUpperCase()}`;
  }, [exportType]);

  return (
    <Modal
      title={
        <Flex align="center" gap="small" className="mb-6!">
          <DownloadOutlined className="text-primary" />
          <Typography.Title level={4} className="mb-0!">
            Export Map Visualizer
          </Typography.Title>
        </Flex>
      }
      open={open}
      onCancel={onClose}
      afterOpenChange={handleAfterOpenChange}
      footer={null}
      width={400}
      destroyOnHidden
    >
      <Flex vertical gap="middle" className="py-md">
        {/* Export Type — varies by plan */}
        <Flex vertical gap="small">
          <Typography.Text className="text-sm text-gray-600">Export type:</Typography.Text>
          <Select
            value={exportType}
            onChange={handleExportTypeChange}
            options={exportTypeOptions}
            className="w-full"
          />
          {allowedFormats.length === 1 && (
            <Typography.Text type="secondary" className="text-xs">
              Free plan: PNG only.{' '}
              <AppNavLink to={ROUTES.BILLING} className="text-primary! font-semibold">
                Upgrade
              </AppNavLink>{' '}
              for SVG, JPEG, GIF and Video.
            </Typography.Text>
          )}
        </Flex>

        {/* Animation: no timeline data warning */}
        {isAnimationFormat && !hasTimelineData && (
          <Typography.Text type="warning" className="text-xs">
            Import a dataset with a time column (year, month, period…) to enable animation export.
          </Typography.Text>
        )}

        {/* Quality Control */}
        {showQualityControl && (
          <Flex vertical gap="small">
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">Quality (%):</Typography.Text>
              <InputNumber
                min={1}
                max={maxQuality}
                value={quality}
                onChange={handleQualityChange}
                className="w-20"
                disabled={plan === PLANS.observer}
              />
            </Flex>
            <Slider
              min={1}
              max={100}
              value={quality}
              onChange={(v: number) => setQuality(Math.min(v, maxQuality))}
              aria-label="Export quality"
              disabled={plan === PLANS.observer}
            />
            {limits.pictureQualityLimit && (
              <Typography.Text type="secondary" className="text-xs">
                Free plan: quality limited to {maxQuality}%.{' '}
                <AppNavLink to="/billing" className="text-primary! font-semibold">
                  Upgrade
                </AppNavLink>{' '}
                for 100%.
              </Typography.Text>
            )}
          </Flex>
        )}

        {/* Animation: FPS control */}
        {isAnimationFormat && hasTimelineData && (
          <Flex vertical gap="small">
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">
                Speed (frames/sec):
              </Typography.Text>
              <InputNumber
                min={0.5}
                max={10}
                step={0.5}
                value={fps}
                onChange={(v: number | null) => setFps(Math.max(0.5, Math.min(v ?? 1, 10)))}
                className="w-20"
              />
            </Flex>
            <Typography.Text type="secondary" className="text-xs">
              {timePeriods.length} frames · ~{Math.round(timePeriods.length / fps)}s duration
            </Typography.Text>
          </Flex>
        )}

        {/* Export progress */}
        {isExporting && isAnimationFormat && (
          <Progress percent={Math.round(progress * 100)} status="active" strokeColor="#18294D" />
        )}

        {/* Download Button */}
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          loading={isExporting}
          disabled={!selectedRegionId || (isAnimationFormat && !hasTimelineData)}
        >
          {downloadButtonLabel}
        </Button>
      </Flex>
    </Modal>
  );
};

export default ExportMapModal;
