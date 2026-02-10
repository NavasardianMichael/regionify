import { type FC, useCallback, useMemo, useState } from 'react';
import { DownloadOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { EXPORT_TYPES, PLAN_FEATURE_LIMITS, PLANS } from '@regionify/shared';
import { Button, Flex, InputNumber, Modal, Progress, Select, Slider, Typography } from 'antd';
import { useShallow } from 'zustand/react/shallow';
import { selectItemsList } from '@/store/legendData/selectors';
import { useLegendDataStore } from '@/store/legendData/store';
import { selectNoDataColor } from '@/store/legendStyles/selectors';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import {
  selectSelectedRegionId,
  selectTimelineData,
  selectTimePeriods,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { selectBorder, selectPicture, selectShadow } from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { exportAnimationAsGif, exportAnimationAsVideo } from '@/helpers/animationExport';
import { loadMapSvg } from '@/helpers/mapLoader';

type AnimationFormat = typeof EXPORT_TYPES.gif | typeof EXPORT_TYPES.mp4;

type FormatOption = {
  value: AnimationFormat;
  label: string;
};

const ANIMATION_FORMAT_OPTIONS: FormatOption[] = [
  { value: EXPORT_TYPES.gif, label: 'GIF' },
  { value: EXPORT_TYPES.mp4, label: 'Video (MP4/WebM)' },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

const ExportAnimationModal: FC<Props> = ({ open, onClose }) => {
  const selectedRegionId = useVisualizerStore(selectSelectedRegionId);
  const timePeriods = useVisualizerStore(selectTimePeriods);
  const timelineData = useVisualizerStore(selectTimelineData);

  const user = useProfileStore(selectUser);
  const plan = user?.plan ?? PLANS.free;
  const limits = PLAN_FEATURE_LIMITS[plan];

  const legendItems = useLegendDataStore(useShallow(selectItemsList));
  const noDataColor = useLegendStylesStore(selectNoDataColor);
  const border = useMapStylesStore(selectBorder);
  const shadow = useMapStylesStore(selectShadow);
  const picture = useMapStylesStore(selectPicture);

  const [format, setFormat] = useState<AnimationFormat>(EXPORT_TYPES.gif);
  const [quality, setQuality] = useState(60);
  const [fps, setFps] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const allowedFormats = useMemo(
    () => ANIMATION_FORMAT_OPTIONS.filter((o) => limits.allowedAnimationFormats.includes(o.value)),
    [limits.allowedAnimationFormats],
  );

  const handleFormatChange = useCallback((value: AnimationFormat) => {
    setFormat(value);
  }, []);

  const handleQualityChange = useCallback((value: number | null) => {
    setQuality(value ?? 60);
  }, []);

  const handleFpsChange = useCallback((value: number | null) => {
    setFps(Math.max(0.5, Math.min(value ?? 1, 10)));
  }, []);

  const handleExport = useCallback(async () => {
    if (!selectedRegionId || timePeriods.length < 2) return;

    setIsExporting(true);
    setProgress(0);

    try {
      const rawSvg = await loadMapSvg(selectedRegionId);
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

      if (format === EXPORT_TYPES.gif) {
        await exportAnimationAsGif(exportOptions);
      } else {
        await exportAnimationAsVideo(exportOptions);
      }

      onClose();
    } catch (error) {
      console.error('Animation export failed:', error);
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [
    selectedRegionId,
    timePeriods,
    timelineData,
    legendItems,
    noDataColor,
    border,
    shadow,
    picture,
    quality,
    fps,
    format,
    onClose,
  ]);

  return (
    <Modal
      title={
        <Flex align="center" gap="small" className="mb-4!">
          <VideoCameraOutlined className="text-primary" />
          <Typography.Title level={4} className="mb-0!">
            Export Animation
          </Typography.Title>
        </Flex>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={420}
      destroyOnHidden
    >
      <Flex vertical gap="middle" className="py-2">
        {/* Format */}
        <Flex vertical gap="small">
          <Typography.Text className="text-sm text-gray-600">Format:</Typography.Text>
          <Select
            value={format}
            onChange={handleFormatChange}
            options={allowedFormats}
            className="w-full"
          />
        </Flex>

        {/* Quality */}
        <Flex vertical gap="small">
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Quality (%):</Typography.Text>
            <InputNumber
              min={25}
              max={100}
              value={quality}
              onChange={handleQualityChange}
              className="w-20"
            />
          </Flex>
          <Slider min={25} max={100} value={quality} onChange={(v: number) => setQuality(v)} />
        </Flex>

        {/* Speed / FPS */}
        <Flex vertical gap="small">
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Speed (frames/sec):</Typography.Text>
            <InputNumber
              min={0.5}
              max={10}
              step={0.5}
              value={fps}
              onChange={handleFpsChange}
              className="w-20"
            />
          </Flex>
          <Typography.Text type="secondary" className="text-xs">
            {timePeriods.length} frames · ~{Math.round(timePeriods.length / fps)}s duration
          </Typography.Text>
        </Flex>

        {/* Progress */}
        {isExporting && (
          <Progress percent={Math.round(progress * 100)} status="active" strokeColor="#18294D" />
        )}

        {/* Export Button */}
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          loading={isExporting}
          disabled={timePeriods.length < 2}
          size="large"
          block
        >
          {isExporting ? 'Exporting...' : `Export ${format === EXPORT_TYPES.gif ? 'GIF' : 'Video'}`}
        </Button>
      </Flex>
    </Modal>
  );
};

export default ExportAnimationModal;
