import { type FC, memo, type RefObject } from 'react';
import { Flex, Spin, Typography } from 'antd';
import {
  selectActiveTimePeriod,
  selectIsGoogleSheetSyncLoading,
  selectSelectedCountryId,
  selectTimePeriods,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { selectRegionLabels } from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';
import styles from '../MapViewer.module.css';

type MapSvgCanvasProps = {
  containerRef: RefObject<HTMLButtonElement | null>;
  mapTransformRef: RefObject<HTMLDivElement | null>;
  svgContent: string;
  isLoading: boolean;
  isDragging: boolean;
  zoom: number;
  pan: { x: number; y: number };
  labelDragMode: boolean;
  ariaLabel: string;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
};

export const MapSvgCanvas: FC<MapSvgCanvasProps> = memo(function MapSvgCanvas({
  containerRef,
  mapTransformRef,
  svgContent,
  isLoading,
  isDragging,
  zoom,
  pan,
  labelDragMode,
  ariaLabel,
  onPointerDown,
  onPointerUp,
}) {
  const selectedCountryId = useVisualizerStore(selectSelectedCountryId);
  const isGoogleSheetSyncLoading = useVisualizerStore(selectIsGoogleSheetSyncLoading);
  const activeTimePeriod = useVisualizerStore(selectActiveTimePeriod);
  const timePeriods = useVisualizerStore(selectTimePeriods);
  const regionLabels = useMapStylesStore(selectRegionLabels);

  const showSheetSyncOnMap =
    isGoogleSheetSyncLoading && Boolean(selectedCountryId) && Boolean(svgContent) && !isLoading;

  return (
    <button
      type="button"
      ref={containerRef}
      aria-label={ariaLabel}
      className={`absolute inset-0 flex items-center justify-center border-none bg-transparent p-0 ${
        labelDragMode ? 'cursor-default' : 'cursor-move'
      }`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{ touchAction: 'none' }}
    >
      {isLoading ? (
        <Spin size="large" />
      ) : svgContent ? (
        <>
          <Flex
            ref={mapTransformRef}
            align="center"
            justify="center"
            className="relative h-[80%] w-[80%]"
            data-map-export-map-transform
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <div
              className={`map-svg-container h-full w-full [&>svg]:h-full [&>svg]:w-full [&>svg]:object-contain ${
                labelDragMode && regionLabels.show ? styles.labelDragHoverTarget : ''
              } ${!labelDragMode ? styles.mapPanCursor : ''} ${
                showSheetSyncOnMap ? 'blur-[3px]' : ''
              }`}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
            {showSheetSyncOnMap && (
              <Flex
                align="center"
                justify="center"
                className="pointer-events-none absolute inset-0 z-20"
                aria-busy
                aria-live="polite"
              >
                <Spin size="large" />
              </Flex>
            )}
          </Flex>
          {activeTimePeriod && timePeriods.length > 1 && (
            <div className="pointer-events-none absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/90 px-4 py-1.5 shadow-md">
              <Typography.Text className="text-sm font-semibold">
                {activeTimePeriod}
              </Typography.Text>
            </div>
          )}
        </>
      ) : (
        <Flex vertical align="center" justify="center" className="text-white/60">
          <Typography.Text className="text-lg text-white/60">
            Select a country to view the map
          </Typography.Text>
        </Flex>
      )}
    </button>
  );
});
