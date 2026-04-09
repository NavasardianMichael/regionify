import { type FC, useCallback, useMemo, useRef } from 'react';
import { PLANS } from '@regionify/shared';
import { Badge, Flex } from 'antd';
import { useShallow } from 'zustand/react/shallow';
import { selectItemsList } from '@/store/legendData/selectors';
import { useLegendDataStore } from '@/store/legendData/store';
import { selectPosition } from '@/store/legendStyles/selectors';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { selectSelectedCountryId } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { selectPicture, selectSetLabelPositionsByRegionId } from '@/store/mapStyles/selectors';
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

type MapViewerProps = {
  className?: string;
  /** When true (e.g. saved project in app), show plan ribbon on the map export root block. */
  showPlanRibbon?: boolean;
  /** Public embed: no card border or radius on the map frame. */
  flatEmbedChrome?: boolean;
};

/** `Badge.Ribbon` puts `className` on the ribbon tab; `rootClassName` targets `.ant-ribbon-wrapper`. */
const RIBBON_ROOT_CLASSNAME = 'flex h-full min-h-0 min-w-0 flex-1 flex-col';

const mapFrameClassNames = (flat: boolean): string =>
  flat
    ? 'group relative min-h-0 flex-1 overflow-hidden'
    : 'group relative min-h-0 flex-1 overflow-hidden rounded-lg border border-gray-200';

const MapViewer: FC<MapViewerProps> = ({
  className = '',
  showPlanRibbon = false,
  flatEmbedChrome = false,
}) => {
  const { t, i18n } = useTypedTranslation();
  const user = useProfileStore(selectUser);
  const plan = user?.plan ?? PLANS.observer;
  const selectedCountryId = useVisualizerStore(selectSelectedCountryId);
  const picture = useMapStylesStore(selectPicture);
  const setLabelPositionsByRegionId = useMapStylesStore(selectSetLabelPositionsByRegionId);
  const position = useLegendStylesStore(selectPosition);
  const legendItems = useLegendDataStore(useShallow(selectItemsList));
  const showBottomLegend = position === LEGEND_POSITIONS.bottom && legendItems.length > 0;

  const containerRef = useRef<HTMLButtonElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const mapTransformRef = useRef<HTMLDivElement>(null);

  const { svgContent, isLoading, labelPositionsRef } = useMapSvg();

  const onResetLabelPositions = useCallback(() => {
    labelPositionsRef.current = {};
    setLabelPositionsByRegionId({});
  }, [labelPositionsRef, setLabelPositionsByRegionId]);

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

  useLabelDrag({ containerRef, svgContent, labelPositionsRef });

  const { handleLegendMouseDown, handleResizeMouseDown } = useLegendDrag({
    containerRef,
    legendRef,
  });

  const dateLocale = i18n.resolvedLanguage ?? i18n.language;
  const mapInteractiveAriaLabel = useMemo(() => {
    if (!selectedCountryId) return t('visualizer.mapAriaNoCountrySelected');
    const region = getLocalizedRegionLabel(selectedCountryId, dateLocale) ?? selectedCountryId;
    return t('visualizer.mapAriaMapOf', { region });
  }, [dateLocale, selectedCountryId, t]);

  const showWatermarkOverlay = useMemo(
    () => plan === PLANS.observer || picture.showWatermark,
    [plan, picture.showWatermark],
  );

  /** Lift only when watermark is drawn inside the map frame (not with bottom legend — see layout below). */
  const zoomStackExtraBottomPx =
    plan === PLANS.observer && !showBottomLegend ? OBSERVER_PLAN_ZOOM_STACK_LIFT_PX : 0;

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
        svgContent={svgContent}
        isLoading={isLoading}
        isDragging={isDragging}
        zoom={zoom}
        pan={pan}
        ariaLabel={mapInteractiveAriaLabel}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />

      {position === LEGEND_POSITIONS.floating && (
        <MapFloatingLegend
          legendRef={legendRef}
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
              className={mapFrameClassNames(flatEmbedChrome)}
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
              className={mapFrameClassNames(flatEmbedChrome)}
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
      >
        {mapExportRoot}
      </Badge.Ribbon>
    );
  }

  return mapExportRoot;
};

export default MapViewer;
