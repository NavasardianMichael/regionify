import { type FC, memo, type RefObject } from 'react';
import { Flex, Spin, Typography } from 'antd';
import {
  selectActiveTimePeriod,
  selectIsGoogleSheetSyncLoading,
  selectSelectedCountryId,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { selectRegionLabels } from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';
import type { TimePeriodLabelOffset } from '@/store/mapStyles/types';
import styles from '../MapViewer.module.css';

type MapSvgCanvasProps = {
  containerRef: RefObject<HTMLButtonElement | null>;
  mapTransformRef: RefObject<HTMLDivElement | null>;
  periodLabelRef: RefObject<HTMLDivElement | null>;
  svgContent: string;
  isLoading: boolean;
  isDragging: boolean;
  zoom: number;
  pan: { x: number; y: number };
  ariaLabel: string;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  showTimePeriodLabel: boolean;
  timePeriodLabelOffset: TimePeriodLabelOffset;
  periodLabelDragging: boolean;
  onPeriodLabelPointerDown: (e: React.PointerEvent) => void;
};

export const MapSvgCanvas: FC<MapSvgCanvasProps> = memo(function MapSvgCanvas({
  containerRef,
  mapTransformRef,
  periodLabelRef,
  svgContent,
  isLoading,
  isDragging,
  zoom,
  pan,
  ariaLabel,
  onPointerDown,
  onPointerUp,
  showTimePeriodLabel,
  timePeriodLabelOffset,
  periodLabelDragging,
  onPeriodLabelPointerDown,
}) {
  const selectedCountryId = useVisualizerStore(selectSelectedCountryId);
  const isGoogleSheetSyncLoading = useVisualizerStore(selectIsGoogleSheetSyncLoading);
  const activeTimePeriod = useVisualizerStore(selectActiveTimePeriod);
  const regionLabels = useMapStylesStore(selectRegionLabels);

  const showSheetSyncOnMap =
    isGoogleSheetSyncLoading && Boolean(selectedCountryId) && Boolean(svgContent) && !isLoading;

  return (
    <button
      type="button"
      ref={containerRef}
      aria-label={ariaLabel}
      data-i18n-key="visualizer.mapAriaMapOf"
      className="absolute inset-0 flex cursor-move items-center justify-center border-none bg-transparent p-0"
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
              className={`map-svg-container h-full w-full [&>svg]:h-full [&>svg]:w-full [&>svg]:overflow-visible [&>svg]:object-contain ${styles.mapPanCursor} ${
                regionLabels.show ? styles.labelDragHoverTarget : ''
              } ${showSheetSyncOnMap ? 'blur-[3px]' : ''}`}
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
          {showTimePeriodLabel && activeTimePeriod && (
            <div
              ref={periodLabelRef}
              data-map-export-time-period-label
              role="status"
              aria-live="polite"
              className={`absolute top-4 left-1/2 z-10 touch-none rounded-full bg-white/90 px-4 py-1.5 shadow-md select-none ${
                periodLabelDragging ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing'
              }`}
              style={{
                left: '50%',
                top: '1rem',
                ...(!periodLabelDragging && {
                  transform: `translate(calc(-50% + ${timePeriodLabelOffset.x}px), ${timePeriodLabelOffset.y}px)`,
                }),
              }}
              onPointerDown={onPeriodLabelPointerDown}
            >
              <Typography.Text className="pointer-events-none text-sm font-semibold">
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
