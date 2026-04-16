import { type FC, useCallback, useMemo, useRef } from 'react';
import { PLANS } from '@regionify/shared';
import { Badge, Flex } from 'antd';
import { useShallow } from 'zustand/react/shallow';
import { selectItemsList } from '@/store/legendData/selectors';
import { useLegendDataStore } from '@/store/legendData/store';
import { selectPosition } from '@/store/legendStyles/selectors';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import {
  selectActiveTimePeriod,
  selectSelectedCountryId,
  selectTimePeriods,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import {
  selectPicture,
  selectSetLabelPositionsByRegionId,
  selectSetMapStylesState,
  selectTimePeriodLabelOffset,
} from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';
import { resolveOpaqueMapBackgroundColor } from '@/constants/mapStyles';
import { OBSERVER_PLAN_ZOOM_STACK_LIFT_PX } from '@/constants/mapViewer';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { planRibbonColor, planRibbonNameKey } from '@/helpers/planRibbonColor';
import { getLocalizedRegionLabel } from '@/helpers/regionDisplay';
import { MapBottomLegend } from '@/components/visualizer/MapViewer/MapBottomLegend';
import { MapFloatingLegend } from '@/components/visualizer/MapViewer/MapFloatingLegend';
import { MapPanZoomControls } from '@/components/visualizer/MapViewer/MapPanZoomControls';
import { MapSvgCanvas } from '@/components/visualizer/MapViewer/MapSvgCanvas';
import { MapWatermark } from '@/components/visualizer/MapViewer/MapWatermark';
import { useLabelDrag } from '@/components/visualizer/MapViewer/useLabelDrag';
import { useLegendDrag } from '@/components/visualizer/MapViewer/useLegendDrag';
import { useMapPan } from '@/components/visualizer/MapViewer/useMapPan';
import { useMapSvg } from '@/components/visualizer/MapViewer/useMapSvg';
import { useTimePeriodLabelDrag } from '@/components/visualizer/MapViewer/useTimePeriodLabelDrag';

type MapViewerProps = {
  className?: string;
  /** When true (logged-in app session), show plan ribbon on the map export root block. */
  showPlanRibbon?: boolean;
  /** Public embed: no card border or radius on the map frame. */
  flatEmbedChrome?: boolean;
  /** When false, do not force observer watermark behavior based on current user plan. */
  enforceObserverWatermark?: boolean;
};

/** `Badge.Ribbon` puts `className` on the ribbon tab; `rootClassName` targets `.ant-ribbon-wrapper`. */
const RIBBON_ROOT_CLASSNAME = 'flex h-full min-h-0 min-w-0 flex-1 flex-col';

/** No `rounded-lg` / border on the map frame when embed is flat or legend is bottom-pinned (outer shell can still carry card chrome). */
const mapFrameClassNames = (flatEmbedChrome: boolean, bottomPinnedLegend: boolean): string =>
  flatEmbedChrome || bottomPinnedLegend
    ? 'group relative min-h-0 flex-1 overflow-hidden'
    : 'group relative min-h-0 flex-1 overflow-hidden rounded-lg border border-gray-200';

const MapViewer: FC<MapViewerProps> = ({
  className = '',
  showPlanRibbon = false,
  flatEmbedChrome = false,
  enforceObserverWatermark = true,
}) => {
  const { t, i18n } = useTypedTranslation();
  const user = useProfileStore(selectUser);
  const plan = user?.plan ?? PLANS.observer;
  const selectedCountryId = useVisualizerStore(selectSelectedCountryId);
  const timePeriods = useVisualizerStore(selectTimePeriods);
  const activeTimePeriod = useVisualizerStore(selectActiveTimePeriod);
  const picture = useMapStylesStore(selectPicture);
  const setLabelPositionsByRegionId = useMapStylesStore(selectSetLabelPositionsByRegionId);
  const setMapStylesState = useMapStylesStore(selectSetMapStylesState);
  const timePeriodLabelOffset = useMapStylesStore(selectTimePeriodLabelOffset);
  const position = useLegendStylesStore(selectPosition);
  const legendItems = useLegendDataStore(useShallow(selectItemsList));
  const showBottomLegend = position === LEGEND_POSITIONS.bottom && legendItems.length > 0;

  const containerRef = useRef<HTMLButtonElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const periodLabelRef = useRef<HTMLDivElement>(null);
  const mapTransformRef = useRef<HTMLDivElement>(null);

  const { svgContent, isLoading, labelPositionsRef } = useMapSvg();

  const onResetLabelPositions = useCallback(() => {
    labelPositionsRef.current = {};
    setLabelPositionsByRegionId({});
    if (timePeriods.length > 1) {
      setMapStylesState({ timePeriodLabelOffset: { x: 0, y: 0 } });
    }
  }, [labelPositionsRef, setLabelPositionsByRegionId, setMapStylesState, timePeriods.length]);

  const {
    zoom,
    pan,
    isDragging,
    handlePointerDown,
    handlePointerUp,
    handleZoomIn,
    handleZoomOut,
    handlePanUp,
    handlePanDown,
    handlePanLeft,
    handlePanRight,
    handleResetView,
  } = useMapPan({ containerRef, mapTransformRef, onResetLabelPositions });

  useLabelDrag({ containerRef, svgContent, labelPositionsRef, enabled: !flatEmbedChrome });

  const { isLegendDragging, handleLegendMouseDown, handleResizeMouseDown } = useLegendDrag({
    containerRef,
    legendRef,
  });

  const showTimePeriodLabel = Boolean(activeTimePeriod && timePeriods.length > 1);
  const { isDragging: isPeriodLabelDragging, handlePeriodLabelPointerDown } =
    useTimePeriodLabelDrag({
      containerRef,
      periodLabelRef,
      enabled: showTimePeriodLabel,
    });

  const dateLocale = i18n.resolvedLanguage ?? i18n.language;
  const mapInteractiveAriaLabel = useMemo(() => {
    if (!selectedCountryId) return t('visualizer.mapAriaNoCountrySelected');
    const region = getLocalizedRegionLabel(selectedCountryId, dateLocale) ?? selectedCountryId;
    return t('visualizer.mapAriaMapOf', { region });
  }, [dateLocale, selectedCountryId, t]);

  const isObserverWatermarkForced = enforceObserverWatermark && plan === PLANS.observer;
  const showWatermarkOverlay = useMemo(
    () => isObserverWatermarkForced || picture.showWatermark,
    [isObserverWatermarkForced, picture.showWatermark],
  );

  /** Lift only when watermark is drawn inside the map frame (not with bottom legend — see layout below). */
  const zoomStackExtraBottomPx =
    isObserverWatermarkForced && !showBottomLegend ? OBSERVER_PLAN_ZOOM_STACK_LIFT_PX : 0;

  const mapBackgroundStyle = useMemo(
    () => ({
      backgroundColor: picture.transparentBackground
        ? 'transparent'
        : resolveOpaqueMapBackgroundColor(picture),
    }),
    [picture],
  );

  const mapInterior = (
    <>
      <MapSvgCanvas
        containerRef={containerRef}
        mapTransformRef={mapTransformRef}
        periodLabelRef={periodLabelRef}
        svgContent={svgContent}
        isLoading={isLoading}
        isDragging={isDragging}
        zoom={zoom}
        pan={pan}
        ariaLabel={mapInteractiveAriaLabel}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        showTimePeriodLabel={showTimePeriodLabel}
        timePeriodLabelOffset={timePeriodLabelOffset}
        periodLabelDragging={isPeriodLabelDragging}
        onPeriodLabelPointerDown={handlePeriodLabelPointerDown}
      />

      {position === LEGEND_POSITIONS.floating && (
        <MapFloatingLegend
          legendRef={legendRef}
          isDragging={isLegendDragging}
          onLegendMouseDown={handleLegendMouseDown}
          onResizeMouseDown={handleResizeMouseDown}
        />
      )}

      {!showBottomLegend && <MapWatermark show={showWatermarkOverlay} />}

      <MapPanZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onPanUp={handlePanUp}
        onPanDown={handlePanDown}
        onPanLeft={handlePanLeft}
        onPanRight={handlePanRight}
        onResetView={handleResetView}
        zoomStackExtraBottomPx={zoomStackExtraBottomPx}
      />
    </>
  );

  const mapExportRoot = (
    <Flex vertical className={`min-h-0 flex-1 ${className}`} data-map-export-root>
      <Flex vertical className="h-full min-h-0 flex-1">
        {showBottomLegend ? (
          <Flex
            vertical
            className={
              flatEmbedChrome
                ? 'relative min-h-0 flex-1 flex-col overflow-hidden'
                : 'relative min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200'
            }
            data-map-export-map-area
          >
            <Flex
              align="center"
              justify="center"
              className={mapFrameClassNames(flatEmbedChrome, showBottomLegend)}
              style={mapBackgroundStyle}
            >
              {mapInterior}
            </Flex>
            <MapBottomLegend />
            <MapWatermark show={showWatermarkOverlay} />
          </Flex>
        ) : (
          <>
            <Flex
              align="center"
              justify="center"
              className={mapFrameClassNames(flatEmbedChrome, showBottomLegend)}
              data-map-export-map-area
              style={mapBackgroundStyle}
            >
              {mapInterior}
            </Flex>
            <MapBottomLegend />
          </>
        )}
      </Flex>
    </Flex>
  );

  if (showPlanRibbon && user) {
    return (
      <Badge.Ribbon
        text={t(planRibbonNameKey(plan))}
        color={planRibbonColor(plan)}
        placement="end"
        rootClassName={RIBBON_ROOT_CLASSNAME}
        className="top-2! font-medium"
        data-i18n-key="plans.items.observer.name"
      >
        {mapExportRoot}
      </Badge.Ribbon>
    );
  }

  return mapExportRoot;
};

export default MapViewer;
