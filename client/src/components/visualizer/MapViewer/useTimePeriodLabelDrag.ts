import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { selectSetMapStylesState } from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';

type UseTimePeriodLabelDragParams = {
  containerRef: RefObject<HTMLButtonElement | null>;
  periodLabelRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
};

type UseTimePeriodLabelDragReturn = {
  isDragging: boolean;
  handlePeriodLabelPointerDown: (e: React.PointerEvent) => void;
};

export function useTimePeriodLabelDrag({
  containerRef,
  periodLabelRef,
  enabled,
}: UseTimePeriodLabelDragParams): UseTimePeriodLabelDragReturn {
  const offset = useMapStylesStore((s) => s.timePeriodLabelOffset);
  const setMapStylesState = useMapStylesStore(selectSetMapStylesState);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetAtStartRef = useRef({ x: 0, y: 0 });
  const pendingRef = useRef({ x: 0, y: 0 });
  const latestRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const flushRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const applyTransform = useCallback(
    (ox: number, oy: number) => {
      const el = periodLabelRef.current;
      if (!el) return;
      el.style.transform = `translate(calc(-50% + ${ox}px), ${oy}px)`;
    },
    [periodLabelRef],
  );

  const clampToContainer = useCallback(
    (nx: number, ny: number): { x: number; y: number } => {
      const cr = containerRef.current?.getBoundingClientRect();
      const el = periodLabelRef.current;
      if (!cr || !el) return { x: nx, y: ny };

      applyTransform(nx, ny);
      let lr = el.getBoundingClientRect();

      if (lr.left < cr.left) nx += cr.left - lr.left;
      if (lr.right > cr.right) nx -= lr.right - cr.right;
      if (lr.top < cr.top) ny += cr.top - lr.top;
      if (lr.bottom > cr.bottom) ny -= lr.bottom - cr.bottom;

      applyTransform(nx, ny);
      lr = el.getBoundingClientRect();
      if (lr.left < cr.left) nx += cr.left - lr.left;
      if (lr.right > cr.right) nx -= lr.right - cr.right;
      if (lr.top < cr.top) ny += cr.top - lr.top;
      if (lr.bottom > cr.bottom) ny -= lr.bottom - cr.bottom;

      return { x: nx, y: ny };
    },
    [applyTransform, containerRef, periodLabelRef],
  );

  /**
   * While dragging, MapSvgCanvas omits `transform` from React props so we can drive it here.
   * React still commits that props update and clears the previous transform — without an
   * immediate re-apply, a click/double-click with no `pointermove` flashes the default
   * top-center position until pointerup.
   */
  useLayoutEffect(() => {
    if (!isDragging || !periodLabelRef.current) return;
    const o = useMapStylesStore.getState().timePeriodLabelOffset;
    applyTransform(o.x, o.y);
  }, [isDragging, applyTransform, periodLabelRef]);

  const handlePeriodLabelPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      e.stopPropagation();
      e.preventDefault();

      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      offsetAtStartRef.current = { ...offset };
      pendingRef.current = { ...offset };
      latestRef.current = { ...offset };
      periodLabelRef.current?.style.setProperty('will-change', 'transform');
    },
    [enabled, offset, periodLabelRef],
  );

  const handleWindowMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !containerRef.current || !periodLabelRef.current) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      latestRef.current = {
        x: offsetAtStartRef.current.x + dx,
        y: offsetAtStartRef.current.y + dy,
      };

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          const { x: lx, y: ly } = latestRef.current;
          const clamped = clampToContainer(lx, ly);
          pendingRef.current = clamped;
          applyTransform(clamped.x, clamped.y);
          rafRef.current = null;
        });
      }
    },
    [isDragging, applyTransform, clampToContainer, containerRef, periodLabelRef],
  );

  const handleWindowUp = useCallback(() => {
    flushRaf();
    if (!isDragging) return;

    const { x: lx, y: ly } = latestRef.current;
    const clamped = clampToContainer(lx, ly);
    setMapStylesState({ timePeriodLabelOffset: { x: clamped.x, y: clamped.y } });

    if (periodLabelRef.current) {
      periodLabelRef.current.style.willChange = 'auto';
    }
    setIsDragging(false);
  }, [flushRaf, isDragging, clampToContainer, setMapStylesState, periodLabelRef]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handleWindowMove);
      window.addEventListener('pointerup', handleWindowUp);
      window.addEventListener('pointercancel', handleWindowUp);
      return () => {
        window.removeEventListener('pointermove', handleWindowMove);
        window.removeEventListener('pointerup', handleWindowUp);
        window.removeEventListener('pointercancel', handleWindowUp);
      };
    }
  }, [isDragging, handleWindowMove, handleWindowUp]);

  return { isDragging, handlePeriodLabelPointerDown };
}
