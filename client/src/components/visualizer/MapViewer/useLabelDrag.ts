import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { selectRegionLabels, selectSetLabelPositionsByRegionId } from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';

type UseLabelDragParams = {
  containerRef: RefObject<HTMLButtonElement | null>;
  svgContent: string;
  labelPositionsRef: RefObject<Record<string, { x: number; y: number }>>;
  enabled?: boolean;
};

export function useLabelDrag({
  containerRef,
  svgContent,
  labelPositionsRef,
  enabled = true,
}: UseLabelDragParams): void {
  const regionLabels = useMapStylesStore(selectRegionLabels);
  const setLabelPositionsByRegionId = useMapStylesStore(selectSetLabelPositionsByRegionId);

  const draggingLabelRef = useRef<{
    element: SVGTextElement;
    svgElement: SVGSVGElement;
    regionId: string;
    pointerOffset: { x: number; y: number };
  } | null>(null);

  const labelDragMoveImplRef = useRef<(e: PointerEvent) => void>(() => {});
  const labelDragEndImplRef = useRef<(e: PointerEvent) => void>(() => {});

  const stableWindowPointerMove = useCallback((e: PointerEvent) => {
    labelDragMoveImplRef.current(e);
  }, []);

  const stableWindowPointerUpOrCancel = useCallback((e: PointerEvent) => {
    labelDragEndImplRef.current(e);
  }, []);

  const screenToSvgCoords = useCallback(
    (svgEl: SVGSVGElement, clientX: number, clientY: number) => {
      const rect = svgEl.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;

      const viewBox = svgEl.viewBox.baseVal;
      const hasViewBox = viewBox && viewBox.width > 0 && viewBox.height > 0;

      const localX = clientX - rect.left;
      const localY = clientY - rect.top;

      if (hasViewBox) {
        return {
          x: viewBox.x + (localX / rect.width) * viewBox.width,
          y: viewBox.y + (localY / rect.height) * viewBox.height,
        };
      }

      return {
        x: (localX / rect.width) * svgEl.clientWidth,
        y: (localY / rect.height) * svgEl.clientHeight,
      };
    },
    [],
  );

  useLayoutEffect(() => {
    labelDragMoveImplRef.current = (e: PointerEvent) => {
      const dragging = draggingLabelRef.current;
      if (!dragging) return;

      const svgCoords = screenToSvgCoords(dragging.svgElement, e.clientX, e.clientY);
      if (!svgCoords) return;

      dragging.element.setAttribute('x', String(svgCoords.x - dragging.pointerOffset.x));
      dragging.element.setAttribute('y', String(svgCoords.y - dragging.pointerOffset.y));
    };
  }, [screenToSvgCoords]);

  useLayoutEffect(() => {
    labelDragEndImplRef.current = (e: PointerEvent) => {
      const dragging = draggingLabelRef.current;
      if (dragging) {
        try {
          if (dragging.element.hasPointerCapture(e.pointerId)) {
            dragging.element.releasePointerCapture(e.pointerId);
          }
        } catch {
          // No-op: pointer capture wasn't active or isn't supported for this target.
        }
        const svgCoords = screenToSvgCoords(dragging.svgElement, e.clientX, e.clientY);
        if (svgCoords) {
          labelPositionsRef.current[dragging.regionId] = {
            x: svgCoords.x - dragging.pointerOffset.x,
            y: svgCoords.y - dragging.pointerOffset.y,
          };
          setLabelPositionsByRegionId({ ...labelPositionsRef.current });
        }
      }

      draggingLabelRef.current = null;
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', stableWindowPointerMove);
      window.removeEventListener('pointerup', stableWindowPointerUpOrCancel);
      window.removeEventListener('pointercancel', stableWindowPointerUpOrCancel);
    };
  }, [
    labelPositionsRef,
    screenToSvgCoords,
    setLabelPositionsByRegionId,
    stableWindowPointerMove,
    stableWindowPointerUpOrCancel,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container || !svgContent || !regionLabels.show) return;
    const pointerDownListenerOptions: AddEventListenerOptions = { capture: true };

    const handleLabelPointerDown = (e: PointerEvent) => {
      const rawTarget = e.target;
      if (!(rawTarget instanceof Element)) return;

      const labelTarget = rawTarget.closest('text[data-region-id]');
      if (!(labelTarget instanceof SVGTextElement)) return;

      e.stopPropagation();
      e.preventDefault();

      const regionId = labelTarget.getAttribute('data-region-id');
      if (!regionId) return;

      const svgRoot = labelTarget.ownerSVGElement;
      if (!svgRoot) return;
      const pointerSvgCoords = screenToSvgCoords(svgRoot, e.clientX, e.clientY);
      if (!pointerSvgCoords) return;

      try {
        labelTarget.setPointerCapture(e.pointerId);
      } catch {
        // Some SVG implementations can reject pointer capture; drag still works via window listeners.
      }

      const currentX = Number.parseFloat(labelTarget.getAttribute('x') ?? '');
      const currentY = Number.parseFloat(labelTarget.getAttribute('y') ?? '');
      const labelX = Number.isFinite(currentX) ? currentX : pointerSvgCoords.x;
      const labelY = Number.isFinite(currentY) ? currentY : pointerSvgCoords.y;

      draggingLabelRef.current = {
        element: labelTarget,
        svgElement: svgRoot,
        regionId,
        pointerOffset: {
          x: pointerSvgCoords.x - labelX,
          y: pointerSvgCoords.y - labelY,
        },
      };

      document.body.style.cursor = 'grabbing';
      window.addEventListener('pointermove', stableWindowPointerMove);
      window.addEventListener('pointerup', stableWindowPointerUpOrCancel);
      window.addEventListener('pointercancel', stableWindowPointerUpOrCancel);
    };

    container.addEventListener('pointerdown', handleLabelPointerDown, pointerDownListenerOptions);

    return () => {
      container.removeEventListener(
        'pointerdown',
        handleLabelPointerDown,
        pointerDownListenerOptions,
      );
      window.removeEventListener('pointermove', stableWindowPointerMove);
      window.removeEventListener('pointerup', stableWindowPointerUpOrCancel);
      window.removeEventListener('pointercancel', stableWindowPointerUpOrCancel);
      draggingLabelRef.current = null;
      document.body.style.cursor = '';
    };
  }, [
    enabled,
    containerRef,
    svgContent,
    regionLabels.show,
    screenToSvgCoords,
    stableWindowPointerMove,
    stableWindowPointerUpOrCancel,
  ]);
}
