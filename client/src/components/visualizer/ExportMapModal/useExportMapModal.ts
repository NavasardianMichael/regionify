import { useCallback, useMemo, useState } from 'react';
import { EXPORT_TYPES, type ExportType, PLAN_DETAILS, PLANS } from '@regionify/shared';
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
  selectHasTimelineData,
  selectSelectedCountryId,
  selectTimelineData,
  selectTimePeriods,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import {
  selectBorder,
  selectLabelPositionsByRegionId,
  selectPicture,
  selectRegionLabels,
  selectShadow,
} from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import {
  exportAnimationAsGif,
  exportAnimationAsVideo,
  type LegendPositionExport,
} from '@/helpers/animationExport';
import { exportMapAsJpeg, exportMapAsPng, exportMapAsSvg } from '@/helpers/mapExport';
import { loadMapSvg } from '@/helpers/mapLoader';
import { useAppFeedback } from '@/components/shared/useAppFeedback';

type ExportTypeOption = { value: ExportType; label: string };

const ALL_EXPORT_OPTIONS: ExportTypeOption[] = [
  { value: EXPORT_TYPES.png, label: 'PNG' },
  { value: EXPORT_TYPES.svg, label: 'SVG' },
  { value: EXPORT_TYPES.jpeg, label: 'JPEG' },
  { value: EXPORT_TYPES.gif, label: 'GIF (Animation)' },
  { value: EXPORT_TYPES.mp4, label: 'Video (MP4/WebM)' },
];

const STATIC_EXPORT_TYPES: ExportType[] = [EXPORT_TYPES.png, EXPORT_TYPES.svg, EXPORT_TYPES.jpeg];
const DYNAMIC_EXPORT_TYPES: ExportType[] = [EXPORT_TYPES.gif, EXPORT_TYPES.mp4];

const DEFAULT_QUALITY = 60;
const DEFAULT_SECONDS_PER_PERIOD = 2;
export const EXPORT_FPS = 30;

export function useExportMapModal(_open: boolean, onClose: () => void) {
  const { t } = useTypedTranslation();
  const { message } = useAppFeedback();
  const selectedCountryId = useVisualizerStore(selectSelectedCountryId);
  const hasTimelineData = useVisualizerStore(selectHasTimelineData);
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
  const labelPositionsByRegionId = useMapStylesStore(selectLabelPositionsByRegionId);

  const maxQuality = limits.maxExportQuality;
  const initialQuality = Math.min(DEFAULT_QUALITY, maxQuality);
  const allowedFormats = limits.allowedExportFormats;
  const planSupportsDynamic = limits.historicalDataImport;

  const exportTypeOptions = useMemo(() => {
    const allowed = ALL_EXPORT_OPTIONS.filter((o) => allowedFormats.includes(o.value));
    if (hasTimelineData) {
      return allowed.filter((o) => DYNAMIC_EXPORT_TYPES.includes(o.value));
    }
    return allowed.filter((o) => STATIC_EXPORT_TYPES.includes(o.value));
  }, [allowedFormats, hasTimelineData]);

  const defaultExportType = exportTypeOptions[0]?.value ?? allowedFormats[0] ?? EXPORT_TYPES.jpeg;

  const exportTypeInfoTooltip = useMemo(() => {
    if (!planSupportsDynamic) return null;
    if (hasTimelineData) {
      return 'Static image formats are not supported with panel data. Use GIF or MP4 to export the animation.';
    }
    return 'Animated formats (GIF, MP4) require panel/dynamic data with a time column. Use static image formats with current data.';
  }, [planSupportsDynamic, hasTimelineData]);

  const [exportType, setExportType] = useState<ExportType>(defaultExportType);
  /** `null` while the user clears the field to type a new value; export uses `resolvedQuality`. */
  const [quality, setQuality] = useState<number | null>(initialQuality);
  const [secondsPerPeriod, setSecondsPerPeriod] = useState<number | null>(
    DEFAULT_SECONDS_PER_PERIOD,
  );
  const [smoothTransitions, setSmoothTransitions] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const isAnimationFormat = exportType === EXPORT_TYPES.gif || exportType === EXPORT_TYPES.mp4;

  const resolvedQuality = useMemo(() => {
    const q = quality;
    if (q === null) return Math.min(DEFAULT_QUALITY, maxQuality);
    return Math.min(Math.max(q, 1), maxQuality);
  }, [quality, maxQuality]);

  const resolvedSecondsPerPeriod = useMemo(() => {
    const s = secondsPerPeriod;
    if (s === null) return DEFAULT_SECONDS_PER_PERIOD;
    return Math.max(0.5, Math.min(s, 10));
  }, [secondsPerPeriod]);

  const handleAfterOpenChange = useCallback(
    (visible: boolean) => {
      if (visible) {
        setExportType(defaultExportType);
        setQuality(Math.min(DEFAULT_QUALITY, maxQuality));
        setSecondsPerPeriod(DEFAULT_SECONDS_PER_PERIOD);
      }
    },
    [defaultExportType, maxQuality],
  );

  const handleExportTypeChange = useCallback((value: ExportType) => {
    setExportType(value);
  }, []);

  const handleQualityInputChange = useCallback((value: number | null) => {
    setQuality(value);
  }, []);

  const handleQualitySliderChange = useCallback((value: number) => {
    setQuality(value);
  }, []);

  const handleQualityBlur = useCallback(() => {
    setQuality((q) => {
      if (q === null) return Math.min(DEFAULT_QUALITY, maxQuality);
      return Math.min(Math.max(q, 1), maxQuality);
    });
  }, [maxQuality]);

  const handleSecondsInputChange = useCallback((value: number | null) => {
    setSecondsPerPeriod(value);
  }, []);

  const handleSecondsBlur = useCallback(() => {
    setSecondsPerPeriod((s) => {
      if (s === null) return DEFAULT_SECONDS_PER_PERIOD;
      return Math.max(0.5, Math.min(s, 10));
    });
  }, []);

  const staticStillOpts = useMemo(
    () => ({
      backgroundColor: picture.transparentBackground ? undefined : picture.backgroundColor,
      legendDraw:
        legendPosition !== LEGEND_POSITIONS.hidden && legendItems.length > 0
          ? {
              title: legendTitle,
              labels: legendLabels,
              items: legendItems,
              noDataColor,
              backgroundColor: legendBackgroundColor,
            }
          : null,
    }),
    [
      picture.transparentBackground,
      picture.backgroundColor,
      legendPosition,
      legendItems,
      legendTitle,
      legendLabels,
      noDataColor,
      legendBackgroundColor,
    ],
  );

  const exportHandlers = useMemo(
    () => ({
      [EXPORT_TYPES.svg]: (fileName: string) => exportMapAsSvg(fileName),
      [EXPORT_TYPES.png]: (fileName: string) =>
        exportMapAsPng(resolvedQuality, fileName, staticStillOpts),
      [EXPORT_TYPES.jpeg]: (fileName: string) => {
        if (plan === PLANS.observer) {
          return exportMapAsJpeg(resolvedQuality, fileName, {
            ...staticStillOpts,
            backgroundColor: '#f5f5f5',
            watermark: { text: 'Regionify', showTrademark: true },
          });
        }
        return exportMapAsJpeg(resolvedQuality, fileName, {
          ...staticStillOpts,
          backgroundColor: staticStillOpts.backgroundColor ?? '#ffffff',
        });
      },
    }),
    [resolvedQuality, plan, staticStillOpts],
  );

  const handleDownload = useCallback(async () => {
    const fileName = selectedCountryId ? `regionify-${selectedCountryId}` : 'regionify-map';

    setIsExporting(true);
    setProgress(0);
    try {
      if (isAnimationFormat) {
        if (!hasTimelineData) {
          message.warning(t('messages.importHistoricalFirst'), 0);
          return;
        }
        const rawSvg = await loadMapSvg(selectedCountryId!);
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
          quality: resolvedQuality,
          fps: EXPORT_FPS,
          secondsPerPeriod: resolvedSecondsPerPeriod,
          smooth: smoothTransitions,
          legendPosition: exportLegendPosition,
          floatingPosition,
          regionLabels,
          labelPositions: labelPositionsByRegionId,
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
      message.success(t('messages.mapExportedAs', { format: exportType.toUpperCase() }), 5);
      onClose();
    } catch {
      message.error(t('messages.exportFailed'), 0);
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [
    exportType,
    isAnimationFormat,
    hasTimelineData,
    selectedCountryId,
    exportHandlers,
    message,
    timePeriods,
    timelineData,
    legendItems,
    noDataColor,
    border,
    shadow,
    picture,
    legendLabels,
    legendTitle,
    legendBackgroundColor,
    legendPosition,
    floatingPosition,
    regionLabels,
    labelPositionsByRegionId,
    resolvedQuality,
    resolvedSecondsPerPeriod,
    smoothTransitions,
    onClose,
    t,
  ]);

  const showQualityControl = useMemo(() => {
    return exportType === EXPORT_TYPES.png || exportType === EXPORT_TYPES.jpeg || isAnimationFormat;
  }, [exportType, isAnimationFormat]);

  const downloadButtonLabel = useMemo(() => {
    if (exportType === EXPORT_TYPES.gif) return 'Download GIF';
    if (exportType === EXPORT_TYPES.mp4) return 'Download Video';
    return `Download ${exportType.toUpperCase()}`;
  }, [exportType]);

  return {
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
    handleAfterOpenChange,
    handleExportTypeChange,
    handleQualityInputChange,
    handleQualitySliderChange,
    handleQualityBlur,
    handleSecondsInputChange,
    handleSecondsBlur,
    handleDownload,
    showQualityControl,
    downloadButtonLabel,
  };
}

export type ExportMapModalFormProps = ReturnType<typeof useExportMapModal>;
