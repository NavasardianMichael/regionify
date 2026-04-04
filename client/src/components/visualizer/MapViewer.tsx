import { type FC, useCallback, useMemo, useRef, useState } from 'react';
import { PLANS } from '@regionify/shared';
import { Flex } from 'antd';
import { selectPosition } from '@/store/legendStyles/selectors';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { selectSelectedCountryId } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { selectPicture, selectSetLabelPositionsByRegionId } from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
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
};

const MapViewer: FC<MapViewerProps> = ({ className = '' }) => {
  const { t, i18n } = useTypedTranslation();
  const user = useProfileStore(selectUser);
  const plan = user?.plan ?? PLANS.observer;
  const selectedCountryId = useVisualizerStore(selectSelectedCountryId);
  const picture = useMapStylesStore(selectPicture);
  const setLabelPositionsByRegionId = useMapStylesStore(selectSetLabelPositionsByRegionId);
  const position = useLegendStylesStore(selectPosition);

  const containerRef = useRef<HTMLButtonElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const mapTransformRef = useRef<HTMLDivElement>(null);

  const [labelDragMode, setLabelDragMode] = useState(false);

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
  } = useMapPan({ containerRef, mapTransformRef, labelDragMode, onResetLabelPositions });

  useLabelDrag({ containerRef, svgContent, labelPositionsRef, labelDragMode, zoom, pan });

  const { handleLegendMouseDown, handleResizeMouseDown } = useLegendDrag({
    containerRef,
    legendRef,
  });

  const handleToggleLabelDragMode = useCallback(() => {
    setLabelDragMode((prev) => !prev);
  }, []);

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

  return (
    <Flex vertical className={`min-h-0 flex-1 ${className}`} data-map-export-root>
      <Flex vertical className="h-full min-h-0 flex-1">
        <Flex
          align="center"
          justify="center"
          className="group relative min-h-0 flex-1 overflow-hidden rounded-lg border border-gray-200"
          data-map-export-map-area
          style={{
            backgroundColor: picture.transparentBackground
              ? 'transparent'
              : picture.backgroundColor,
          }}
        >
          <MapSvgCanvas
            containerRef={containerRef}
            mapTransformRef={mapTransformRef}
            svgContent={svgContent}
            isLoading={isLoading}
            isDragging={isDragging}
            zoom={zoom}
            pan={pan}
            labelDragMode={labelDragMode}
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

          <MapWatermark show={showWatermarkOverlay} />

          <MapPanZoomControls
            labelDragMode={labelDragMode}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onPanUp={handlePanUp}
            onPanDown={handlePanDown}
            onPanLeft={handlePanLeft}
            onPanRight={handlePanRight}
            onResetView={handleResetView}
            onToggleLabelDragMode={handleToggleLabelDragMode}
          />
        </Flex>

        <MapBottomLegend />
      </Flex>
    </Flex>
  );
};

export default MapViewer;
