import { type FC, useCallback, useMemo, useState } from 'react';
import { VideoCameraOutlined } from '@ant-design/icons';
import { EXPORT_TYPES, PLAN_DETAILS, PLANS } from '@regionify/shared';
import { Flex, Modal, Typography } from 'antd';
import { useShallow } from 'zustand/react/shallow';
import { selectItemsList } from '@/store/legendData/selectors';
import { useLegendDataStore } from '@/store/legendData/store';
import {
  selectBackgroundColor,
  selectFloatingPosition,
  selectLabels,
  selectNoDataColor,
  selectPosition,
  selectTitle,
} from '@/store/legendStyles/selectors';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import {
  selectSelectedRegionId,
  selectTimelineData,
  selectTimePeriods,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import {
  selectBorder,
  selectPicture,
  selectRegionLabelPositions,
  selectRegionLabels,
  selectShadow,
} from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';
import {
  exportAnimationAsGif,
  exportAnimationAsVideo,
  type LegendPositionExport,
} from '@/helpers/animationExport';
import { loadMapSvg } from '@/helpers/mapLoader';
import { ExportAnimationModalForm } from '@/components/visualizer/ExportAnimationModal/ExportAnimationModalForm';

type AnimationFormat = typeof EXPORT_TYPES.gif | typeof EXPORT_TYPES.mp4;

type FormatOption = { value: AnimationFormat; label: string };

const ANIMATION_FORMAT_OPTIONS: FormatOption[] = [
  { value: EXPORT_TYPES.gif, label: 'GIF' },
  { value: EXPORT_TYPES.mp4, label: 'Video (MP4/WebM)' },
];

const EXPORT_FPS = 30;
const DEFAULT_SECONDS_PER_PERIOD = 2;

type Props = {
  open: boolean;
  onClose: () => void;
};

const ExportAnimationModal: FC<Props> = ({ open, onClose }) => {
  const selectedRegionId = useVisualizerStore(selectSelectedRegionId);
  const timePeriods = useVisualizerStore(selectTimePeriods);
  const timelineData = useVisualizerStore(selectTimelineData);

  const user = useProfileStore(selectUser);
  const plan = user?.plan ?? PLANS.observer;
  const { limits } = PLAN_DETAILS[plan];

  const legendItems = useLegendDataStore(useShallow(selectItemsList));
  const noDataColor = useLegendStylesStore(selectNoDataColor);
  const legendLabels = useLegendStylesStore(selectLabels);
  const legendTitle = useLegendStylesStore(selectTitle);
  const legendBackgroundColor = useLegendStylesStore(selectBackgroundColor);
  const legendPosition = useLegendStylesStore(selectPosition);
  const floatingPosition = useLegendStylesStore(selectFloatingPosition);
  const border = useMapStylesStore(selectBorder);
  const shadow = useMapStylesStore(selectShadow);
  const picture = useMapStylesStore(selectPicture);
  const regionLabels = useMapStylesStore(selectRegionLabels);
  const regionLabelPositions = useMapStylesStore(selectRegionLabelPositions);

  const [format, setFormat] = useState<AnimationFormat>(EXPORT_TYPES.gif);
  const [quality, setQuality] = useState(60);
  const [secondsPerPeriod, setSecondsPerPeriod] = useState(DEFAULT_SECONDS_PER_PERIOD);
  const [smoothTransitions, setSmoothTransitions] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const allowedFormats = useMemo(
    () => ANIMATION_FORMAT_OPTIONS.filter((o) => limits.allowedAnimationFormats.includes(o.value)),
    [limits.allowedAnimationFormats],
  );

  const handleExport = useCallback(async () => {
    if (!selectedRegionId || timePeriods.length < 2) return;

    setIsExporting(true);
    setProgress(0);

    try {
      const rawSvg = await loadMapSvg(selectedRegionId);
      if (!rawSvg) throw new Error('Failed to load map SVG');

      const exportLegendPosition: LegendPositionExport =
        legendPosition === LEGEND_POSITIONS.floating ? 'floating' : 'bottom';

      const exportOptions = {
        rawSvg,
        timePeriods,
        timelineData,
        legendItems,
        noDataColor,
        border,
        shadow,
        picture,
        legend: {
          title: legendTitle,
          labels: legendLabels,
          backgroundColor: legendBackgroundColor,
        },
        quality,
        fps: EXPORT_FPS,
        secondsPerPeriod,
        smooth: smoothTransitions,
        legendPosition: exportLegendPosition,
        floatingPosition,
        regionLabels,
        labelPositions: regionLabelPositions,
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
    legendPosition,
    floatingPosition,
    regionLabels,
    regionLabelPositions,
    legendLabels,
    legendTitle,
    legendBackgroundColor,
    quality,
    secondsPerPeriod,
    smoothTransitions,
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
      <ExportAnimationModalForm
        format={format}
        quality={quality}
        secondsPerPeriod={secondsPerPeriod}
        smoothTransitions={smoothTransitions}
        isExporting={isExporting}
        progress={progress}
        timePeriodsCount={timePeriods.length}
        allowedFormats={allowedFormats}
        onFormatChange={setFormat}
        onQualityChange={(v) => setQuality(v ?? 60)}
        onSecondsPerPeriodChange={(v) => setSecondsPerPeriod(Math.max(0.5, Math.min(v ?? 2, 10)))}
        onSmoothTransitionsChange={setSmoothTransitions}
        onExport={handleExport}
      />
    </Modal>
  );
};

export default ExportAnimationModal;
