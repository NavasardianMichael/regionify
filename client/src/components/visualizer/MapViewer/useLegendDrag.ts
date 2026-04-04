import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  selectFloatingPosition,
  selectFloatingSize,
  selectPosition,
  selectSetLegendStylesState,
} from '@/store/legendStyles/selectors';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';

const LEGEND_MIN_WIDTH_PX = 120;
const LEGEND_MIN_HEIGHT_PX = 80;
const LEGEND_RESIZE_CONTAINER_PADDING_PX = 8;

type UseLegendDragParams = {
  containerRef: RefObject<HTMLButtonElement | null>;
  legendRef: RefObject<HTMLDivElement | null>;
};

type UseLegendDragReturn = {
  isLegendDragging: boolean;
  isLegendResizing: boolean;
  handleLegendMouseDown: (e: React.PointerEvent) => void;
  handleResizeMouseDown: (e: React.PointerEvent) => void;
};

export function useLegendDrag({
  containerRef,
  legendRef,
}: UseLegendDragParams): UseLegendDragReturn {
  const position = useLegendStylesStore(selectPosition);
  const floatingPosition = useLegendStylesStore(selectFloatingPosition);
  const floatingSize = useLegendStylesStore(selectFloatingSize);
  const setLegendStylesState = useLegendStylesStore(selectSetLegendStylesState);

  const [isLegendDragging, setIsLegendDragging] = useState(false);
  const [isLegendResizing, setIsLegendResizing] = useState(false);

  const legendDragStartRef = useRef({ x: 0, y: 0 });
  const legendOffsetRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const currentWidthRef = useRef(0);
  const currentHeightRef = useRef(0);

  const handleLegendMouseDown = useCallback(
    (e: React.PointerEvent) => {
      if (position !== LEGEND_POSITIONS.floating) return;
      e.stopPropagation();
      e.preventDefault();

      setIsLegendDragging(true);
      legendDragStartRef.current = { x: e.clientX, y: e.clientY };
      legendOffsetRef.current = { x: 0, y: 0 };

      if (legendRef.current) {
        legendRef.current.style.willChange = 'transform';
      }
    },
    [position, legendRef],
  );

  const updateLegendTransform = useCallback(() => {
    if (legendRef.current && isLegendDragging) {
      legendRef.current.style.transform = `translate(${legendOffsetRef.current.x}px, ${legendOffsetRef.current.y}px)`;
    }
    rafIdRef.current = null;
  }, [isLegendDragging, legendRef]);

  const handleLegendMouseMove = useCallback(
    (e: PointerEvent) => {
      if (isLegendDragging && containerRef.current && legendRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const legendRect = legendRef.current.getBoundingClientRect();

        let offsetX = e.clientX - legendDragStartRef.current.x;
        let offsetY = e.clientY - legendDragStartRef.current.y;

        const currentLeft = floatingPosition.x + offsetX;
        const currentTop = floatingPosition.y + offsetY;

        if (currentLeft < 0) offsetX = -floatingPosition.x;
        if (currentTop < 0) offsetY = -floatingPosition.y;
        if (currentLeft + legendRect.width > containerRect.width) {
          offsetX = containerRect.width - legendRect.width - floatingPosition.x;
        }
        if (currentTop + legendRect.height > containerRect.height) {
          offsetY = containerRect.height - legendRect.height - floatingPosition.y;
        }

        legendOffsetRef.current = { x: offsetX, y: offsetY };

        if (rafIdRef.current === null) {
          rafIdRef.current = requestAnimationFrame(updateLegendTransform);
        }
      }

      if (isLegendResizing && legendRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const deltaX = e.clientX - resizeStartRef.current.x;
        const deltaY = e.clientY - resizeStartRef.current.y;
        let newWidth = Math.max(LEGEND_MIN_WIDTH_PX, resizeStartRef.current.width + deltaX);
        let newHeight = Math.max(LEGEND_MIN_HEIGHT_PX, resizeStartRef.current.height + deltaY);

        const maxW = Math.max(
          LEGEND_MIN_WIDTH_PX,
          containerRect.width - floatingPosition.x - LEGEND_RESIZE_CONTAINER_PADDING_PX,
        );
        const maxH = Math.max(
          LEGEND_MIN_HEIGHT_PX,
          containerRect.height - floatingPosition.y - LEGEND_RESIZE_CONTAINER_PADDING_PX,
        );
        newWidth = Math.min(newWidth, maxW);
        newHeight = Math.min(newHeight, maxH);

        currentWidthRef.current = newWidth;
        currentHeightRef.current = newHeight;

        if (rafIdRef.current === null) {
          rafIdRef.current = requestAnimationFrame(() => {
            if (legendRef.current) {
              legendRef.current.style.width = `${currentWidthRef.current}px`;
              legendRef.current.style.height = `${currentHeightRef.current}px`;
            }
            rafIdRef.current = null;
          });
        }
      }
    },
    [
      isLegendDragging,
      isLegendResizing,
      floatingPosition,
      updateLegendTransform,
      containerRef,
      legendRef,
    ],
  );

  const handleLegendMouseUp = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (isLegendDragging) {
      const finalX = floatingPosition.x + legendOffsetRef.current.x;
      const finalY = floatingPosition.y + legendOffsetRef.current.y;
      setLegendStylesState({ floatingPosition: { x: finalX, y: finalY } });

      if (legendRef.current) {
        legendRef.current.style.transform = '';
        legendRef.current.style.willChange = 'auto';
      }
    }

    if (isLegendResizing && currentWidthRef.current > 0 && currentHeightRef.current > 0) {
      setLegendStylesState({
        floatingSize: {
          width: currentWidthRef.current,
          height: currentHeightRef.current,
        },
      });
      currentWidthRef.current = 0;
      currentHeightRef.current = 0;
      if (legendRef.current) {
        legendRef.current.style.width = '';
        legendRef.current.style.height = '';
        legendRef.current.style.willChange = 'auto';
      }
    }

    setIsLegendDragging(false);
    setIsLegendResizing(false);
  }, [isLegendDragging, isLegendResizing, floatingPosition, setLegendStylesState, legendRef]);

  const handleResizeMouseDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!legendRef.current) return;

      setIsLegendResizing(true);
      const rect = legendRef.current.getBoundingClientRect();
      const startHeight = floatingSize.height === 'auto' ? rect.height : floatingSize.height;
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: floatingSize.width,
        height: startHeight,
      };
      currentWidthRef.current = floatingSize.width;
      currentHeightRef.current = startHeight;

      legendRef.current.style.willChange = 'width, height';
    },
    [floatingSize.width, floatingSize.height, legendRef],
  );

  useEffect(() => {
    if (isLegendDragging || isLegendResizing) {
      window.addEventListener('pointermove', handleLegendMouseMove);
      window.addEventListener('pointerup', handleLegendMouseUp);
      return () => {
        window.removeEventListener('pointermove', handleLegendMouseMove);
        window.removeEventListener('pointerup', handleLegendMouseUp);
      };
    }
  }, [isLegendDragging, isLegendResizing, handleLegendMouseMove, handleLegendMouseUp]);

  return {
    isLegendDragging,
    isLegendResizing,
    handleLegendMouseDown,
    handleResizeMouseDown,
  };
}
