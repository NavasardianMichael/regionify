import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { selectRegionLabels, selectSetLabelPositionsByRegionId } from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';

type UseLabelDragParams = {
  containerRef: RefObject<HTMLButtonElement | null>;
  svgContent: string;
  labelPositionsRef: RefObject<Record<string, { x: number; y: number }>>;
  labelDragMode: boolean;
  zoom: number;
  pan: { x: number; y: number };
};

export function useLabelDrag({
  containerRef,
  svgContent,
  labelPositionsRef,
  labelDragMode,
  zoom,
  pan,
}: UseLabelDragParams): void {
  const regionLabels = useMapStylesStore(selectRegionLabels);
  const setLabelPositionsByRegionId = useMapStylesStore(selectSetLabelPositionsByRegionId);

  const draggingLabelRef = useRef<{
    element: SVGTextElement;
    svgElement: SVGSVGElement;
    regionId: string;
  } | null>(null);
  const handleLabelDragEndRef = useRef<((e: PointerEvent) => void) | null>(null);

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

  const handleLabelDragMove = useCallback(
    (e: PointerEvent) => {
      const dragging = draggingLabelRef.current;
      if (!dragging) return;

      const svgCoords = screenToSvgCoords(dragging.svgElement, e.clientX, e.clientY);
      if (!svgCoords) return;

      dragging.element.setAttribute('x', String(svgCoords.x));
      dragging.element.setAttribute('y', String(svgCoords.y));
    },
    [screenToSvgCoords],
  );

  const handleLabelDragEnd = useCallback(
    (e: PointerEvent) => {
      const dragging = draggingLabelRef.current;
      if (!dragging) return;

      const svgCoords = screenToSvgCoords(dragging.svgElement, e.clientX, e.clientY);
      if (svgCoords) {
        labelPositionsRef.current[dragging.regionId] = { x: svgCoords.x, y: svgCoords.y };
        setLabelPositionsByRegionId({ ...labelPositionsRef.current });
      }

      draggingLabelRef.current = null;
      window.removeEventListener('pointermove', handleLabelDragMove);
      if (handleLabelDragEndRef.current) {
        window.removeEventListener('pointerup', handleLabelDragEndRef.current);
      }
    },
    [screenToSvgCoords, handleLabelDragMove, setLabelPositionsByRegionId, labelPositionsRef],
  );

  useLayoutEffect(() => {
    handleLabelDragEndRef.current = handleLabelDragEnd;
  }, [handleLabelDragEnd]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !svgContent || !regionLabels.show || !labelDragMode) return;

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

      window.addEventListener('pointermove', handleLabelDragMove);
      if (handleLabelDragEndRef.current) {
        window.addEventListener('pointerup', handleLabelDragEndRef.current);
      }
    };

    textElements.forEach((el) => {
      el.addEventListener('pointerdown', handleLabelPointerDown);
    });

    return () => {
      textElements.forEach((el) => {
        el.removeEventListener('pointerdown', handleLabelPointerDown);
      });
    };
  }, [
    containerRef,
    svgContent,
    regionLabels.show,
    labelDragMode,
    handleLabelDragMove,
    handleLabelDragEnd,
    zoom,
    pan,
  ]);
}
