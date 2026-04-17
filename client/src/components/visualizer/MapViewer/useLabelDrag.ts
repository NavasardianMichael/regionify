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
      const ctm = svgEl.getScreenCTM();
      if (!ctm) return null;
      const pt = svgEl.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      return pt.matrixTransform(ctm.inverse());
    },
    [],
  );

  useLayoutEffect(() => {
    labelDragMoveImplRef.current = (e: PointerEvent) => {
      const dragging = draggingLabelRef.current;
      if (!dragging) return;

      const svgCoords = screenToSvgCoords(dragging.svgElement, e.clientX, e.clientY);
      if (!svgCoords) return;

      dragging.element.setAttribute('x', String(svgCoords.x));
      dragging.element.setAttribute('y', String(svgCoords.y));
    };
  }, [screenToSvgCoords]);

  useLayoutEffect(() => {
    labelDragEndImplRef.current = (e: PointerEvent) => {
      const dragging = draggingLabelRef.current;
      if (dragging) {
        const svgCoords = screenToSvgCoords(dragging.svgElement, e.clientX, e.clientY);
        if (svgCoords) {
          labelPositionsRef.current[dragging.regionId] = { x: svgCoords.x, y: svgCoords.y };
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

    const textElements = container.querySelectorAll<SVGTextElement>('text[data-region-id]');

    const handleLabelPointerDown = (e: PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const target = e.currentTarget as SVGTextElement;
      const regionId = target.getAttribute('data-region-id');
      if (!regionId) return;

      const svgRoot = target.ownerSVGElement;
      if (!svgRoot) return;

      draggingLabelRef.current = {
        element: target,
        svgElement: svgRoot,
        regionId,
      };

      document.body.style.cursor = 'grabbing';
      window.addEventListener('pointermove', stableWindowPointerMove);
      window.addEventListener('pointerup', stableWindowPointerUpOrCancel);
      window.addEventListener('pointercancel', stableWindowPointerUpOrCancel);
    };

    textElements.forEach((el) => {
      el.addEventListener('pointerdown', handleLabelPointerDown);
    });

    return () => {
      textElements.forEach((el) => {
        el.removeEventListener('pointerdown', handleLabelPointerDown);
      });
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
    stableWindowPointerMove,
    stableWindowPointerUpOrCancel,
  ]);
}
