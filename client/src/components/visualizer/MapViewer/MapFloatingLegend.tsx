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
  selectTransparentBackground,
} from '@/store/legendStyles/selectors';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { MapLegendContent } from '@/components/visualizer/MapViewer/MapLegendContent';

type MapFloatingLegendProps = {
  legendRef: RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  onLegendMouseDown: (e: React.PointerEvent) => void;
  onResizeMouseDown: (e: React.PointerEvent) => void;
  /** When set (e.g. embed), overrides store `floatingPosition` for layout only. */
  layoutPosition?: { x: number; y: number };
};

export const MapFloatingLegend: FC<MapFloatingLegendProps> = ({
  legendRef,
  isDragging,
  onLegendMouseDown,
  onResizeMouseDown,
  layoutPosition,
}) => {
  const floatingPosition = useLegendStylesStore(selectFloatingPosition);
  const floatingSize = useLegendStylesStore(selectFloatingSize);
  const transparentBackground = useLegendStylesStore(selectTransparentBackground);
  const backgroundColor = useLegendStylesStore(selectBackgroundColor);
  const labels = useLegendStylesStore(selectLabels);
  const title = useLegendStylesStore(selectTitle);
  const noDataColor = useLegendStylesStore(selectNoDataColor);
  const legendItems = useLegendDataStore(useShallow(selectItemsList));

  if (legendItems.length === 0) return null;

  const floatingLegendHeightPx = floatingSize.height === 'auto' ? undefined : floatingSize.height;
  const isFloatingLegendHeightFixed = floatingSize.height !== 'auto';
  const resolvedPosition = layoutPosition ?? floatingPosition;

  const legendPointerClass = isDragging ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing';

  return (
    <div
      ref={legendRef}
      role="region"
      aria-label="Map legend"
      data-map-export-floating-legend
      className={`p-sm absolute rounded-lg shadow-[0_0_1px_rgba(24,41,77,0.3)] backdrop-blur-sm transition-shadow duration-200 select-none hover:shadow-[0_0_4px_rgba(24,41,77,0.3)] ${legendPointerClass} ${
        isFloatingLegendHeightFixed ? 'flex min-h-0 flex-col overflow-hidden' : ''
      }`}
      onPointerDown={onLegendMouseDown}
      style={{
        left: resolvedPosition.x,
        top: resolvedPosition.y,
        width: floatingSize.width,
        ...(floatingLegendHeightPx != null ? { height: floatingLegendHeightPx } : {}),
        backgroundColor: transparentBackground ? 'transparent' : backgroundColor,
      }}
    >
      {isFloatingLegendHeightFixed ? (
        <div className="scrollbar-legend min-h-0 flex-1 overflow-y-auto pr-0.5">
          <MapLegendContent
            title={title}
            labels={labels}
            legendItems={legendItems}
            noDataColor={noDataColor}
          />
        </div>
      ) : (
        <MapLegendContent
          title={title}
          labels={labels}
          legendItems={legendItems}
          noDataColor={noDataColor}
        />
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
