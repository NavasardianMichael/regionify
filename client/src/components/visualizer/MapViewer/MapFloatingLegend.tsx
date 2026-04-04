import { type FC, type RefObject } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { selectItemsList } from '@/store/legendData/selectors';
import { useLegendDataStore } from '@/store/legendData/store';
import {
  selectBackgroundColor,
  selectFloatingPosition,
  selectFloatingSize,
  selectLabels,
  selectNoDataColor,
  selectTitle,
} from '@/store/legendStyles/selectors';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { MapLegendContent } from '@/components/visualizer/MapViewer/MapLegendContent';

type MapFloatingLegendProps = {
  legendRef: RefObject<HTMLDivElement | null>;
  onLegendMouseDown: (e: React.PointerEvent) => void;
  onResizeMouseDown: (e: React.PointerEvent) => void;
};

export const MapFloatingLegend: FC<MapFloatingLegendProps> = ({
  legendRef,
  onLegendMouseDown,
  onResizeMouseDown,
}) => {
  const floatingPosition = useLegendStylesStore(selectFloatingPosition);
  const floatingSize = useLegendStylesStore(selectFloatingSize);
  const backgroundColor = useLegendStylesStore(selectBackgroundColor);
  const labels = useLegendStylesStore(selectLabels);
  const title = useLegendStylesStore(selectTitle);
  const noDataColor = useLegendStylesStore(selectNoDataColor);
  const legendItems = useLegendDataStore(useShallow(selectItemsList));

  if (legendItems.length === 0) return null;

  const floatingLegendHeightPx = floatingSize.height === 'auto' ? undefined : floatingSize.height;
  const isFloatingLegendHeightFixed = floatingSize.height !== 'auto';

  return (
    <div
      ref={legendRef}
      role="region"
      aria-label="Map legend"
      data-map-export-floating-legend
      className={`p-sm absolute rounded-lg shadow-[0_0_1px_rgba(24,41,77,0.3)] backdrop-blur-sm transition-shadow duration-200 select-none hover:shadow-[0_0_4px_rgba(24,41,77,0.3)] ${
        isFloatingLegendHeightFixed ? 'flex min-h-0 flex-col overflow-hidden' : 'cursor-move'
      }`}
      style={{
        left: floatingPosition.x,
        top: floatingPosition.y,
        width: floatingSize.width,
        ...(floatingLegendHeightPx != null ? { height: floatingLegendHeightPx } : {}),
        backgroundColor,
      }}
    >
      {isFloatingLegendHeightFixed ? (
        <>
          <button
            type="button"
            aria-label="Drag to reposition legend"
            className="z-10 mb-1 h-8 w-full shrink-0 cursor-move border-none bg-transparent p-0"
            onPointerDown={onLegendMouseDown}
          />
          <div className="z-20 min-h-0 flex-1 overflow-y-auto pr-1">
            <MapLegendContent
              title={title}
              labels={labels}
              legendItems={legendItems}
              noDataColor={noDataColor}
            />
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            aria-label="Drag to reposition legend"
            className="absolute inset-0 z-10 cursor-move border-none bg-transparent p-0"
            onPointerDown={onLegendMouseDown}
          />
          <div className="pointer-events-none relative z-20">
            <MapLegendContent
              title={title}
              labels={labels}
              legendItems={legendItems}
              noDataColor={noDataColor}
            />
          </div>
        </>
      )}
      <button
        type="button"
        aria-label="Resize legend width and height"
        className="absolute -right-1 -bottom-1 z-20 h-6 w-6 cursor-se-resize rounded-bl-lg border-none bg-transparent p-0 transition-colors hover:bg-gray-100"
        onPointerDown={onResizeMouseDown}
      >
        <svg
          className="h-full w-full p-1 text-gray-400"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
        </svg>
      </button>
    </div>
  );
};
