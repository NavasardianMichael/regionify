import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { selectSelectedCountryId } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';

const PAN_STEP = 50;

type UseMapPanParams = {
  containerRef: RefObject<HTMLButtonElement | null>;
  mapTransformRef: RefObject<HTMLDivElement | null>;
  onResetLabelPositions: () => void;
};

type UseMapPanReturn = {
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  panRef: RefObject<{ x: number; y: number } | null>;
  handlePointerDown: (e: React.PointerEvent) => void;
  handlePointerUp: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handlePanUp: () => void;
  handlePanDown: () => void;
  handlePanLeft: () => void;
  handlePanRight: () => void;
  handleResetView: () => void;
};

export function useMapPan({
  containerRef,
  mapTransformRef,
  onResetLabelPositions,
}: UseMapPanParams): UseMapPanReturn {
  const selectedCountryId = useVisualizerStore(selectSelectedCountryId);

  const [prevCountryId, setPrevCountryId] = useState(selectedCountryId);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Reset viewport when country changes (React-recommended "adjust during render" pattern)
  if (prevCountryId !== selectedCountryId) {
    setPrevCountryId(selectedCountryId);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  const panRef = useRef(pan);
  const mapPanListenersActiveRef = useRef(false);
  const mapPanDragStartRef = useRef({ x: 0, y: 0 });
  const mapPanPendingRef = useRef({ x: 0, y: 0 });
  const mapPanRafRef = useRef<number | null>(null);
  const endMapPanDragRef = useRef<(() => void) | null>(null);

  const flushMapPanRaf = useCallback(() => {
    if (mapPanRafRef.current !== null) {
      cancelAnimationFrame(mapPanRafRef.current);
      mapPanRafRef.current = null;
    }
  }, []);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.2, 0.5));
  }, []);

  const handlePanUp = useCallback(() => {
    setPan((prev) => ({ ...prev, y: prev.y + PAN_STEP }));
  }, []);

  const handlePanDown = useCallback(() => {
    setPan((prev) => ({ ...prev, y: prev.y - PAN_STEP }));
  }, []);

  const handlePanLeft = useCallback(() => {
    setPan((prev) => ({ ...prev, x: prev.x + PAN_STEP }));
  }, []);

  const handlePanRight = useCallback(() => {
    setPan((prev) => ({ ...prev, x: prev.x - PAN_STEP }));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    onResetLabelPositions();
  }, [onResetLabelPositions]);

  const handleMapPanWindowMove = useCallback((e: PointerEvent) => {
    mapPanPendingRef.current = {
      x: e.clientX - mapPanDragStartRef.current.x,
      y: e.clientY - mapPanDragStartRef.current.y,
    };
    if (mapPanRafRef.current === null) {
      mapPanRafRef.current = requestAnimationFrame(() => {
        const next = mapPanPendingRef.current;
        panRef.current = next;
        setPan(next);
        mapPanRafRef.current = null;
      });
    }
  }, []);

  const endMapPanDrag = useCallback(() => {
    if (!mapPanListenersActiveRef.current) return;
    mapPanListenersActiveRef.current = false;
    flushMapPanRaf();
    const finalPan = mapPanPendingRef.current;
    panRef.current = finalPan;
    setPan(finalPan);
    setIsDragging(false);
    window.removeEventListener('pointermove', handleMapPanWindowMove);
    if (endMapPanDragRef.current) {
      window.removeEventListener('pointerup', endMapPanDragRef.current);
    }
    if (mapTransformRef.current) {
      mapTransformRef.current.style.willChange = 'auto';
    }
  }, [flushMapPanRaf, handleMapPanWindowMove, mapTransformRef]);

  useLayoutEffect(() => {
    endMapPanDragRef.current = endMapPanDrag;
  }, [endMapPanDrag]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (mapPanListenersActiveRef.current) return;

      const t = e.target;
      if (t instanceof Element && t.closest('text[data-region-id]')) {
        return;
      }

      const p = panRef.current;
      mapPanDragStartRef.current = {
        x: e.clientX - p.x,
        y: e.clientY - p.y,
      };
      mapPanPendingRef.current = { ...p };
      mapPanListenersActiveRef.current = true;
      setIsDragging(true);

      if (mapTransformRef.current) {
        mapTransformRef.current.style.willChange = 'transform';
      }

      window.addEventListener('pointermove', handleMapPanWindowMove);
      if (endMapPanDragRef.current) {
        window.addEventListener('pointerup', endMapPanDragRef.current);
      }
    },
    [handleMapPanWindowMove, mapTransformRef],
  );

  const handlePointerUp = useCallback(() => {
    endMapPanDrag();
  }, [endMapPanDrag]);

  useEffect(() => {
    return () => {
      flushMapPanRaf();
      window.removeEventListener('pointermove', handleMapPanWindowMove);
      if (endMapPanDragRef.current) {
        window.removeEventListener('pointerup', endMapPanDragRef.current);
      }
      mapPanListenersActiveRef.current = false;
    };
  }, [flushMapPanRaf, handleMapPanWindowMove]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.min(Math.max(prev * delta, 0.5), 5));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [containerRef, handleWheel]);

  return {
    zoom,
    pan,
    isDragging,
    panRef,
    handlePointerDown,
    handlePointerUp,
    handleZoomIn,
    handleZoomOut,
    handlePanUp,
    handlePanDown,
    handlePanLeft,
    handlePanRight,
    handleResetView,
  };
}
