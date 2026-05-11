import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { selectSelectedCountryId } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import type { MapViewport } from '@/store/mapStyles/types';
import { DEFAULT_MAP_VIEWPORT } from '@/constants/mapStyles';

const PAN_STEP = 50;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const ZOOM_BUTTON_FACTOR = 1.2;
const WHEEL_ZOOM_SENSITIVITY = 0.0015;
const VIEWPORT_EPSILON = 0.001;
/** Disable CSS easing + sync viewport this long after the last wheel tick. */
const STEP_INTERACTION_IDLE_DELAY_MS = 140;
/** rAF-eased zoom/pan animation length for +/- and arrow buttons. */
const BUTTON_EASE_DURATION_MS = 160;
/** Slightly longer ease so Reset View settles into place. */
const RESET_EASE_DURATION_MS = 220;

type UseMapPanParams = {
  containerRef: RefObject<HTMLButtonElement | null>;
  mapTransformRef: RefObject<HTMLDivElement | null>;
  onResetLabelPositions: () => void;
  initialViewport: MapViewport;
  onViewportChange: (viewport: MapViewport) => void;
  /**
   * Sanitized SVG markup; used as a signal that {@link mapTransformRef} has just
   * been (re)mounted so the current viewport can be re-applied to the DOM.
   */
  svgContent: string;
};

type UseMapPanReturn = {
  isDragging: boolean;
  /**
   * True while discrete pan/zoom steps (mouse wheel ticks or +/- buttons) are
   * arriving in quick succession — used to disable the CSS easing so each step
   * lands instantly instead of being interpolated over.
   */
  isStepInteracting: boolean;
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

const areViewportsClose = (
  a: { zoom: number; pan: { x: number; y: number } },
  b: { zoom: number; pan: { x: number; y: number } },
): boolean =>
  Math.abs(a.zoom - b.zoom) < VIEWPORT_EPSILON &&
  Math.abs(a.pan.x - b.pan.x) < VIEWPORT_EPSILON &&
  Math.abs(a.pan.y - b.pan.y) < VIEWPORT_EPSILON;

export function useMapPan({
  containerRef,
  mapTransformRef,
  onResetLabelPositions,
  initialViewport,
  onViewportChange,
  svgContent,
}: UseMapPanParams): UseMapPanReturn {
  const selectedCountryId = useVisualizerStore(selectSelectedCountryId);

  const [isDragging, setIsDragging] = useState(false);
  const [isStepInteracting, setIsStepInteracting] = useState(false);

  const panRef = useRef(initialViewport.pan);
  const viewportRef = useRef<MapViewport>(initialViewport);
  const initialViewportRef = useRef(initialViewport);
  const stepInteractionIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStepInteractingRef = useRef(false);
  /**
   * `null` sentinel so the first non-null country (project load or user pick)
   * is treated as initialization, not a country switch — otherwise we would
   * wipe the saved viewport whenever `selectedCountryId` hydrates.
   */
  const prevCountryIdRef = useRef<typeof selectedCountryId>(null);
  const transformRafRef = useRef<number | null>(null);
  const mapPanListenersActiveRef = useRef(false);
  const mapPanDragStartRef = useRef({ x: 0, y: 0 });
  const endMapPanDragRef = useRef<(() => void) | null>(null);
  /**
   * Live state for the rAF-driven viewport ease used by zoom/pan buttons.
   * Reading from `viewportRef.current` at re-target time means rapid clicks
   * chain from the *current animating* value rather than from where the last
   * tween started — so the visual never "snaps back" to catch up.
   */
  const easeStateRef = useRef<{
    startTime: number;
    startViewport: MapViewport;
    targetViewport: MapViewport;
    duration: number;
  } | null>(null);
  const easeRafRef = useRef<number | null>(null);
  /**
   * Reset View defers the label-position reset to run *after* the map ease has
   * finished — the SVG regeneration triggered by clearing label positions is
   * heavy enough to stall the rAF loop and make the zoom-out look like a snap.
   */
  const resetLabelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushTransformRaf = useCallback(() => {
    if (transformRafRef.current !== null) {
      cancelAnimationFrame(transformRafRef.current);
      transformRafRef.current = null;
    }
  }, []);

  const applyTransform = useCallback(() => {
    const el = mapTransformRef.current;
    if (!el) return;
    const { zoom, pan } = viewportRef.current;
    el.style.transform = `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`;
    panRef.current = pan;
  }, [mapTransformRef]);

  const scheduleTransform = useCallback(() => {
    if (transformRafRef.current !== null) return;
    transformRafRef.current = requestAnimationFrame(() => {
      applyTransform();
      transformRafRef.current = null;
    });
  }, [applyTransform]);

  const syncViewportNow = useCallback(
    (nextViewport: MapViewport) => {
      onViewportChange(nextViewport);
    },
    [onViewportChange],
  );

  useLayoutEffect(() => {
    const wasInitialViewportUpdated = !areViewportsClose(
      initialViewportRef.current,
      initialViewport,
    );
    initialViewportRef.current = initialViewport;

    if (!wasInitialViewportUpdated) return;
    if (mapPanListenersActiveRef.current) return;
    if (areViewportsClose(viewportRef.current, initialViewport)) return;

    viewportRef.current = initialViewport;
    applyTransform();
  }, [applyTransform, initialViewport]);

  useEffect(() => {
    const prev = prevCountryIdRef.current;
    prevCountryIdRef.current = selectedCountryId;
    if (prev == null || selectedCountryId == null || prev === selectedCountryId) return;

    viewportRef.current = DEFAULT_MAP_VIEWPORT;
    applyTransform();
    syncViewportNow(DEFAULT_MAP_VIEWPORT);
  }, [applyTransform, selectedCountryId, syncViewportNow]);

  /**
   * Wheel-only: each tick lands instantly via rAF DOM mutation (no CSS easing
   * to fight) and the store is synced exactly once after
   * {@link STEP_INTERACTION_IDLE_DELAY_MS} of idle.
   */
  const markStepInteraction = useCallback(() => {
    if (!isStepInteractingRef.current) {
      isStepInteractingRef.current = true;
      setIsStepInteracting(true);
    }
    if (stepInteractionIdleTimeoutRef.current) {
      clearTimeout(stepInteractionIdleTimeoutRef.current);
    }
    stepInteractionIdleTimeoutRef.current = setTimeout(() => {
      stepInteractionIdleTimeoutRef.current = null;
      isStepInteractingRef.current = false;
      setIsStepInteracting(false);
      syncViewportNow(viewportRef.current);
    }, STEP_INTERACTION_IDLE_DELAY_MS);
  }, [syncViewportNow]);

  /** Cancel any in-flight button ease (used when wheel / drag takes over). */
  const cancelButtonEase = useCallback(() => {
    if (easeRafRef.current !== null) {
      cancelAnimationFrame(easeRafRef.current);
      easeRafRef.current = null;
    }
    if (easeStateRef.current !== null) {
      easeStateRef.current = null;
      if (isStepInteractingRef.current) {
        isStepInteractingRef.current = false;
        setIsStepInteracting(false);
      }
    }
  }, []);

  /**
   * Smoothly eases the viewport to {@link target} over {@link duration}ms using
   * easeOutCubic. If called while an ease is already running, the animation is
   * re-targeted from the *current* viewport value, so rapid button clicks chain
   * naturally instead of interrupting a CSS transition mid-flight.
   */
  const animateViewportTo = useCallback(
    (target: MapViewport, duration = BUTTON_EASE_DURATION_MS) => {
      if (stepInteractionIdleTimeoutRef.current) {
        clearTimeout(stepInteractionIdleTimeoutRef.current);
        stepInteractionIdleTimeoutRef.current = null;
      }

      easeStateRef.current = {
        startTime: performance.now(),
        startViewport: {
          zoom: viewportRef.current.zoom,
          pan: { x: viewportRef.current.pan.x, y: viewportRef.current.pan.y },
        },
        targetViewport: target,
        duration,
      };

      if (!isStepInteractingRef.current) {
        isStepInteractingRef.current = true;
        setIsStepInteracting(true);
      }

      if (easeRafRef.current !== null) return;

      const tick = (): void => {
        const state = easeStateRef.current;
        if (!state) {
          easeRafRef.current = null;
          return;
        }
        const elapsed = performance.now() - state.startTime;
        const t = Math.min(elapsed / state.duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        viewportRef.current = {
          zoom:
            state.startViewport.zoom +
            (state.targetViewport.zoom - state.startViewport.zoom) * eased,
          pan: {
            x:
              state.startViewport.pan.x +
              (state.targetViewport.pan.x - state.startViewport.pan.x) * eased,
            y:
              state.startViewport.pan.y +
              (state.targetViewport.pan.y - state.startViewport.pan.y) * eased,
          },
        };
        applyTransform();

        if (t < 1) {
          easeRafRef.current = requestAnimationFrame(tick);
        } else {
          easeStateRef.current = null;
          easeRafRef.current = null;
          isStepInteractingRef.current = false;
          setIsStepInteracting(false);
          syncViewportNow(viewportRef.current);
        }
      };

      easeRafRef.current = requestAnimationFrame(tick);
    },
    [applyTransform, syncViewportNow],
  );

  useLayoutEffect(() => {
    applyTransform();
  }, [applyTransform, svgContent]);

  useEffect(() => {
    return () => {
      flushTransformRaf();
    };
  }, [flushTransformRaf]);

  const handleZoomIn = useCallback(() => {
    const nextZoom = Math.min(viewportRef.current.zoom * ZOOM_BUTTON_FACTOR, MAX_ZOOM);
    animateViewportTo({ zoom: nextZoom, pan: viewportRef.current.pan });
  }, [animateViewportTo]);

  const handleZoomOut = useCallback(() => {
    const nextZoom = Math.max(viewportRef.current.zoom / ZOOM_BUTTON_FACTOR, MIN_ZOOM);
    animateViewportTo({ zoom: nextZoom, pan: viewportRef.current.pan });
  }, [animateViewportTo]);

  const handlePanUp = useCallback(() => {
    animateViewportTo({
      zoom: viewportRef.current.zoom,
      pan: { ...viewportRef.current.pan, y: viewportRef.current.pan.y + PAN_STEP },
    });
  }, [animateViewportTo]);

  const handlePanDown = useCallback(() => {
    animateViewportTo({
      zoom: viewportRef.current.zoom,
      pan: { ...viewportRef.current.pan, y: viewportRef.current.pan.y - PAN_STEP },
    });
  }, [animateViewportTo]);

  const handlePanLeft = useCallback(() => {
    animateViewportTo({
      zoom: viewportRef.current.zoom,
      pan: { ...viewportRef.current.pan, x: viewportRef.current.pan.x + PAN_STEP },
    });
  }, [animateViewportTo]);

  const handlePanRight = useCallback(() => {
    animateViewportTo({
      zoom: viewportRef.current.zoom,
      pan: { ...viewportRef.current.pan, x: viewportRef.current.pan.x - PAN_STEP },
    });
  }, [animateViewportTo]);

  const handleResetView = useCallback(() => {
    animateViewportTo(DEFAULT_MAP_VIEWPORT, RESET_EASE_DURATION_MS);
    if (resetLabelTimeoutRef.current) {
      clearTimeout(resetLabelTimeoutRef.current);
    }
    resetLabelTimeoutRef.current = setTimeout(() => {
      resetLabelTimeoutRef.current = null;
      onResetLabelPositions();
    }, RESET_EASE_DURATION_MS);
  }, [animateViewportTo, onResetLabelPositions]);

  const handleMapPanWindowMove = useCallback(
    (e: PointerEvent) => {
      viewportRef.current = {
        ...viewportRef.current,
        pan: {
          x: e.clientX - mapPanDragStartRef.current.x,
          y: e.clientY - mapPanDragStartRef.current.y,
        },
      };
      scheduleTransform();
    },
    [scheduleTransform],
  );

  const endMapPanDrag = useCallback(() => {
    if (!mapPanListenersActiveRef.current) return;
    mapPanListenersActiveRef.current = false;
    flushTransformRaf();
    applyTransform();
    syncViewportNow(viewportRef.current);
    setIsDragging(false);
    window.removeEventListener('pointermove', handleMapPanWindowMove);
    if (endMapPanDragRef.current) {
      window.removeEventListener('pointerup', endMapPanDragRef.current);
    }
    if (mapTransformRef.current) {
      mapTransformRef.current.style.willChange = 'auto';
    }
  }, [applyTransform, flushTransformRaf, handleMapPanWindowMove, mapTransformRef, syncViewportNow]);

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

      // A drag must take over from any in-flight button ease cleanly.
      cancelButtonEase();

      const p = panRef.current;
      mapPanDragStartRef.current = {
        x: e.clientX - p.x,
        y: e.clientY - p.y,
      };
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
    [cancelButtonEase, handleMapPanWindowMove, mapTransformRef],
  );

  const handlePointerUp = useCallback(() => {
    endMapPanDrag();
  }, [endMapPanDrag]);

  useEffect(() => {
    return () => {
      flushTransformRaf();
      if (easeRafRef.current !== null) {
        cancelAnimationFrame(easeRafRef.current);
        easeRafRef.current = null;
      }
      easeStateRef.current = null;
      window.removeEventListener('pointermove', handleMapPanWindowMove);
      if (endMapPanDragRef.current) {
        window.removeEventListener('pointerup', endMapPanDragRef.current);
      }
      mapPanListenersActiveRef.current = false;
      if (stepInteractionIdleTimeoutRef.current) {
        clearTimeout(stepInteractionIdleTimeoutRef.current);
        stepInteractionIdleTimeoutRef.current = null;
      }
      if (resetLabelTimeoutRef.current) {
        clearTimeout(resetLabelTimeoutRef.current);
        resetLabelTimeoutRef.current = null;
      }
    };
  }, [flushTransformRaf, handleMapPanWindowMove]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      // Wheel takes over from any in-flight button ease so they don't compete.
      cancelButtonEase();

      const rect = container.getBoundingClientRect();
      const pointerOffsetFromCenter = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      };

      const prevZoom = viewportRef.current.zoom;
      const nextZoom = Math.min(
        Math.max(prevZoom * Math.exp(-e.deltaY * WHEEL_ZOOM_SENSITIVITY), MIN_ZOOM),
        MAX_ZOOM,
      );

      if (Math.abs(nextZoom - prevZoom) < VIEWPORT_EPSILON) {
        return;
      }

      const prevPan = viewportRef.current.pan;
      const zoomRatio = nextZoom / prevZoom;
      viewportRef.current = {
        zoom: nextZoom,
        pan: {
          x: pointerOffsetFromCenter.x - (pointerOffsetFromCenter.x - prevPan.x) * zoomRatio,
          y: pointerOffsetFromCenter.y - (pointerOffsetFromCenter.y - prevPan.y) * zoomRatio,
        },
      };
      scheduleTransform();
      markStepInteraction();
    },
    [cancelButtonEase, containerRef, markStepInteraction, scheduleTransform],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [containerRef, handleWheel]);

  return {
    isDragging,
    isStepInteracting,
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
