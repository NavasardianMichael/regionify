import {
  type FC,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  DragOutlined,
  FullscreenOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { PLANS } from '@regionify/shared';
import { Button, Flex, Spin, Tooltip, Typography } from 'antd';
import DOMPurify from 'dompurify';
import { selectPlaybackPreviewBlend, selectTransitionType } from '@/store/animation/selectors';
import { useAnimationStore } from '@/store/animation/store';
import { selectLegendItems } from '@/store/legendData/selectors';
import { useLegendDataStore } from '@/store/legendData/store';
import {
  selectBackgroundColor,
  selectFloatingPosition,
  selectFloatingSize,
  selectLabels,
  selectNoDataColor,
  selectPosition,
  selectSetLegendStylesState,
  selectTitle,
} from '@/store/legendStyles/selectors';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import {
  selectActiveTimePeriod,
  selectData,
  selectIsGoogleSheetSyncLoading,
  selectSelectedCountryId,
  selectTimelineData,
  selectTimePeriods,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import {
  selectBorder,
  selectLabelPositionsByRegionId,
  selectPicture,
  selectRegionLabels,
  selectSetLabelPositionsByRegionId,
  selectShadow,
  selectZoomControls,
} from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { applySvgMapStyles } from '@/helpers/applySvgMapStyles';
import { smoothstep01 } from '@/helpers/legendColorInterpolation';
import { loadMapSvg } from '@/helpers/mapLoader';
import { getLocalizedRegionLabel } from '@/helpers/regionDisplay';
import { MapLegendContent } from '@/components/visualizer/MapViewer/MapLegendContent';
import styles from './MapViewer.module.css';

type MapViewerProps = {
  className?: string;
};

/** Shift slightly toward the bottom edge so the mark sits under the control stack instead of on it. */
const OBSERVER_WATERMARK_BOTTOM_BELOW_ZOOM_ANCHOR_PX = 24;

const LEGEND_MIN_WIDTH_PX = 120;
const LEGEND_MIN_HEIGHT_PX = 80;
const LEGEND_RESIZE_CONTAINER_PADDING_PX = 8;

const MapViewer: FC<MapViewerProps> = ({ className = '' }) => {
  const { t, i18n } = useTypedTranslation();
  const isTouchDevice = useIsTouchDevice();
  const user = useProfileStore(selectUser);
  const plan = user?.plan ?? PLANS.observer;
  const containerRef = useRef<HTMLButtonElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const [rawSvgContent, setRawSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [labelDragMode, setLabelDragMode] = useState(false);

  /** Latest pan for drag math (avoids stale closure; state updates are rAF-batched). */
  const panRef = useRef(pan);
  const mapPanListenersActiveRef = useRef(false);
  const mapPanDragStartRef = useRef({ x: 0, y: 0 });
  const mapPanPendingRef = useRef({ x: 0, y: 0 });
  const mapPanRafRef = useRef<number | null>(null);
  const mapTransformRef = useRef<HTMLDivElement>(null);

  // Legend drag state - use refs for smooth animation without re-renders
  const [isLegendDragging, setIsLegendDragging] = useState(false);
  const legendDragStartRef = useRef({ x: 0, y: 0 });
  const legendOffsetRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

  // Legend resize state
  const [isLegendResizing, setIsLegendResizing] = useState(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const currentWidthRef = useRef(0);
  const currentHeightRef = useRef(0);

  // Region label drag state
  const labelPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const prevSelectedCountryIdRef = useRef<string | null>(null);
  const draggingLabelRef = useRef<{
    element: SVGTextElement;
    svgElement: SVGSVGElement;
    regionId: string;
  } | null>(null);

  const selectedCountryId = useVisualizerStore(selectSelectedCountryId);
  const isGoogleSheetSyncLoading = useVisualizerStore(selectIsGoogleSheetSyncLoading);
  const data = useVisualizerStore(selectData);
  const activeTimePeriod = useVisualizerStore(selectActiveTimePeriod);
  const timePeriods = useVisualizerStore(selectTimePeriods);
  const timelineData = useVisualizerStore(selectTimelineData);
  const transitionType = useAnimationStore(selectTransitionType);
  const playbackPreviewBlend = useAnimationStore(selectPlaybackPreviewBlend);
  const legendItemsData = useLegendDataStore(selectLegendItems);
  const border = useMapStylesStore(selectBorder);
  const shadow = useMapStylesStore(selectShadow);
  const zoomControls = useMapStylesStore(selectZoomControls);
  const picture = useMapStylesStore(selectPicture);
  const regionLabels = useMapStylesStore(selectRegionLabels);
  const labelPositionsByRegionId = useMapStylesStore(selectLabelPositionsByRegionId);
  const setLabelPositionsByRegionId = useMapStylesStore(selectSetLabelPositionsByRegionId);
  const labels = useLegendStylesStore(selectLabels);
  const title = useLegendStylesStore(selectTitle);
  const position = useLegendStylesStore(selectPosition);
  const floatingPosition = useLegendStylesStore(selectFloatingPosition);
  const floatingSize = useLegendStylesStore(selectFloatingSize);
  const backgroundColor = useLegendStylesStore(selectBackgroundColor);
  const noDataColor = useLegendStylesStore(selectNoDataColor);
  const setLegendStylesState = useLegendStylesStore(selectSetLegendStylesState);

  const showWatermarkOverlay = useMemo(
    () => plan === PLANS.observer || picture.showWatermark,
    [plan, picture.showWatermark],
  );

  const legendItems = useMemo(
    () => legendItemsData.allIds.map((id) => legendItemsData.byId[id]),
    [legendItemsData.allIds, legendItemsData.byId],
  );

  // Defer legend items for expensive SVG processing to keep inputs responsive
  const deferredLegendItems = useDeferredValue(legendItems);

  const previewColorBlend = useMemo(() => {
    if (!playbackPreviewBlend) return undefined;
    const dataA = timelineData[playbackPreviewBlend.fromPeriod];
    const dataB = timelineData[playbackPreviewBlend.toPeriod];
    if (!dataA || !dataB) return undefined;
    return {
      dataA,
      dataB,
      t: smoothstep01(playbackPreviewBlend.t),
    };
  }, [playbackPreviewBlend, timelineData]);

  const applyStylesToSvg = useCallback(
    (svg: string) =>
      applySvgMapStyles(svg, {
        border,
        shadow,
        picture,
        regionLabels,
        data,
        legendItems: deferredLegendItems,
        noDataColor,
        transitionType,
        colorBlend: previewColorBlend,
        labelPositions: labelPositionsByRegionId,
        pathClass: styles.mapPath,
        pathClassInstant: styles.mapPathInstant,
      }),
    [
      border,
      shadow,
      picture,
      regionLabels,
      data,
      deferredLegendItems,
      noDataColor,
      transitionType,
      previewColorBlend,
      labelPositionsByRegionId,
    ],
  );

  // Derive styled SVG from raw content + styles (no useEffect, computed value)
  const svgContent = useMemo(() => {
    if (!rawSvgContent) return '';
    const styledSvg = applyStylesToSvg(rawSvgContent);
    return DOMPurify.sanitize(styledSvg, {
      USE_PROFILES: { svg: true, svgFilters: true },
      ADD_TAGS: ['use'],
      ADD_ATTR: ['data-region-id', 'cursor'],
    });
  }, [rawSvgContent, applyStylesToSvg]);

  // Clear region label positions only when switching to a different region (not on initial mount)
  useEffect(() => {
    const prev = prevSelectedCountryIdRef.current;
    prevSelectedCountryIdRef.current = selectedCountryId;
    if (prev != null && selectedCountryId != null && prev !== selectedCountryId) {
      setLabelPositionsByRegionId({});
    }
  }, [selectedCountryId, setLabelPositionsByRegionId]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  /**
   * Keep ref in sync for label-drag mouseup (batch into store). During drag, DOM x/y lead until
   * release; svgContent uses labelPositionsByRegionId from the store directly.
   */
  useEffect(() => {
    if (rawSvgContent) {
      labelPositionsRef.current = { ...labelPositionsByRegionId };
    }
  }, [rawSvgContent, labelPositionsByRegionId]);

  // Load raw SVG content only when region changes
  useEffect(() => {
    if (!selectedCountryId) {
      setRawSvgContent('');
      setZoom(1);
      setPan({ x: 0, y: 0 });
      labelPositionsRef.current = {};
      return;
    }

    const loadMap = async () => {
      const countryAtStart = selectedCountryId;
      setIsLoading(true);
      try {
        const svg = await loadMapSvg(countryAtStart);
        if (useVisualizerStore.getState().selectedCountryId !== countryAtStart) {
          return;
        }
        if (svg) {
          setRawSvgContent(svg);
        }
      } catch (error) {
        console.error('Failed to load map:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setZoom(1);
    setPan({ x: 0, y: 0 });
    labelPositionsRef.current = {};
    loadMap();
  }, [selectedCountryId]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.2, 0.5));
  }, []);

  const PAN_STEP = 50;

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
    labelPositionsRef.current = {};
    setLabelPositionsByRegionId({});
  }, [setLabelPositionsByRegionId]);

  const handleToggleLabelDragMode = useCallback(() => {
    setLabelDragMode((prev) => !prev);
  }, []);

  const flushMapPanRaf = useCallback(() => {
    if (mapPanRafRef.current !== null) {
      cancelAnimationFrame(mapPanRafRef.current);
      mapPanRafRef.current = null;
    }
  }, []);

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
    if (!mapPanListenersActiveRef.current) {
      return;
    }
    mapPanListenersActiveRef.current = false;
    flushMapPanRaf();
    const finalPan = mapPanPendingRef.current;
    panRef.current = finalPan;
    setPan(finalPan);
    setIsDragging(false);
    window.removeEventListener('pointermove', handleMapPanWindowMove);
    window.removeEventListener('pointerup', endMapPanDrag);
    if (mapTransformRef.current) {
      mapTransformRef.current.style.willChange = 'auto';
    }
  }, [flushMapPanRaf, handleMapPanWindowMove]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (labelDragMode || mapPanListenersActiveRef.current) return;

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
      window.addEventListener('pointerup', endMapPanDrag);
    },
    [labelDragMode, handleMapPanWindowMove, endMapPanDrag],
  );

  const handlePointerUp = useCallback(() => {
    endMapPanDrag();
  }, [endMapPanDrag]);

  useEffect(() => {
    return () => {
      flushMapPanRaf();
      window.removeEventListener('pointermove', handleMapPanWindowMove);
      window.removeEventListener('pointerup', endMapPanDrag);
      mapPanListenersActiveRef.current = false;
    };
  }, [flushMapPanRaf, handleMapPanWindowMove, endMapPanDrag]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.min(Math.max(prev * delta, 0.5), 5));
  }, []);

  // Attach wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Region label drag - convert screen coordinates to SVG coordinates
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
      window.removeEventListener('pointerup', handleLabelDragEnd);
    },
    [screenToSvgCoords, handleLabelDragMove, setLabelPositionsByRegionId],
  );

  // Attach drag handlers to SVG region label text elements after render
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
      window.addEventListener('pointerup', handleLabelDragEnd);
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
    svgContent,
    regionLabels.show,
    labelDragMode,
    handleLabelDragMove,
    handleLabelDragEnd,
    zoom,
    pan,
  ]);

  // Legend drag handlers - optimized with CSS transforms and requestAnimationFrame
  const handleLegendMouseDown = useCallback(
    (e: React.PointerEvent) => {
      if (position !== LEGEND_POSITIONS.floating) return;
      e.stopPropagation();
      e.preventDefault();

      setIsLegendDragging(true);
      legendDragStartRef.current = { x: e.clientX, y: e.clientY };
      legendOffsetRef.current = { x: 0, y: 0 };

      // Add will-change for GPU acceleration
      if (legendRef.current) {
        legendRef.current.style.willChange = 'transform';
      }
    },
    [position],
  );

  const updateLegendTransform = useCallback(() => {
    if (legendRef.current && isLegendDragging) {
      legendRef.current.style.transform = `translate(${legendOffsetRef.current.x}px, ${legendOffsetRef.current.y}px)`;
    }
    rafIdRef.current = null;
  }, [isLegendDragging]);

  const handleLegendMouseMove = useCallback(
    (e: PointerEvent) => {
      if (isLegendDragging && containerRef.current && legendRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const legendRect = legendRef.current.getBoundingClientRect();

        // Calculate new offset
        let offsetX = e.clientX - legendDragStartRef.current.x;
        let offsetY = e.clientY - legendDragStartRef.current.y;

        // Constrain within container bounds
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

        // Use requestAnimationFrame to batch DOM updates
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
    [isLegendDragging, isLegendResizing, floatingPosition, updateLegendTransform],
  );

  const handleLegendMouseUp = useCallback(() => {
    // Cancel any pending animation frame
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Commit final position to store
    if (isLegendDragging) {
      const finalX = floatingPosition.x + legendOffsetRef.current.x;
      const finalY = floatingPosition.y + legendOffsetRef.current.y;
      setLegendStylesState({ floatingPosition: { x: finalX, y: finalY } });

      // Reset transform and will-change
      if (legendRef.current) {
        legendRef.current.style.transform = '';
        legendRef.current.style.willChange = 'auto';
      }
    }

    // Commit final size to store
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
  }, [isLegendDragging, isLegendResizing, floatingPosition, setLegendStylesState]);

  // Legend resize handler
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
    [floatingSize.width, floatingSize.height],
  );

  // Add global mouse event listeners for legend drag/resize
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

  const legendPositionClasses = useMemo(() => {
    switch (position) {
      case 'floating':
        return '';
      case 'hidden':
        return 'hidden';
      default:
        return 'top-4 right-4';
    }
  }, [position]);

  const isBottomLegend = position === LEGEND_POSITIONS.bottom;

  const floatingLegendHeightPx = floatingSize.height === 'auto' ? undefined : floatingSize.height;
  const isFloatingLegendHeightFixed = floatingSize.height !== 'auto';

  const dateLocale = i18n.resolvedLanguage ?? i18n.language;
  const mapInteractiveAriaLabel = useMemo(() => {
    if (!selectedCountryId) {
      return t('visualizer.mapAriaNoCountrySelected');
    }
    const region = getLocalizedRegionLabel(selectedCountryId, dateLocale) ?? selectedCountryId;
    return t('visualizer.mapAriaMapOf', { region });
  }, [dateLocale, selectedCountryId, t]);

  const showSheetSyncOnMap =
    isGoogleSheetSyncLoading && Boolean(selectedCountryId) && Boolean(svgContent) && !isLoading;

  return (
    <Flex vertical className={`min-h-0 flex-1 ${className}`} data-map-export-root>
      <Flex vertical className="h-full min-h-0 flex-1">
        {/* Map Container */}
        <Flex
          align="center"
          justify="center"
          className="group relative min-h-0 flex-1 overflow-hidden rounded-lg"
          data-map-export-map-area
          style={{
            backgroundColor: picture.transparentBackground
              ? 'transparent'
              : picture.backgroundColor,
          }}
        >
          <button
            type="button"
            ref={containerRef}
            aria-label={mapInteractiveAriaLabel}
            className={`absolute inset-0 flex items-center justify-center border-none bg-transparent p-0 ${
              labelDragMode ? 'cursor-default' : 'cursor-move'
            }`}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
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
                    className={`map-svg-container h-full w-full [&>svg]:h-full [&>svg]:w-full [&>svg]:object-contain ${
                      labelDragMode && regionLabels.show ? styles.labelDragHoverTarget : ''
                    } ${!labelDragMode ? styles.mapPanCursor : ''} ${
                      showSheetSyncOnMap ? 'blur-[3px]' : ''
                    }`}
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
                {activeTimePeriod && timePeriods.length > 1 && (
                  <div className="pointer-events-none absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/90 px-4 py-1.5 shadow-md">
                    <Typography.Text className="text-sm font-semibold">
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

          {/* Floating Legend (inside map container) */}
          {position === LEGEND_POSITIONS.floating && legendItems.length > 0 && (
            <div
              ref={legendRef}
              role="region"
              aria-label="Map legend"
              data-map-export-floating-legend
              className={`absolute ${legendPositionClasses} p-sm rounded-lg shadow-[0_0_1px_rgba(24,41,77,0.3)] backdrop-blur-sm transition-shadow duration-200 select-none hover:shadow-[0_0_4px_rgba(24,41,77,0.3)] ${
                isFloatingLegendHeightFixed
                  ? 'flex min-h-0 flex-col overflow-hidden'
                  : 'cursor-move'
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
                    onPointerDown={handleLegendMouseDown}
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
                    onPointerDown={handleLegendMouseDown}
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
              {/* Resize handle for floating legend */}
              <button
                type="button"
                aria-label="Resize legend width and height"
                className="absolute -right-1 -bottom-1 z-20 h-6 w-6 cursor-se-resize rounded-bl-lg border-none bg-transparent p-0 transition-colors hover:bg-gray-100"
                onPointerDown={handleResizeMouseDown}
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
          )}

          {/* Watermark for observer or when enabled in map styles — offset when zoom UI is shown */}
          {showWatermarkOverlay && (
            <Flex
              align="center"
              gap={6}
              className="pointer-events-none absolute z-10 opacity-40 select-none"
              style={
                zoomControls.show
                  ? {
                      right: zoomControls.position.x,
                      bottom: Math.max(
                        0,
                        zoomControls.position.y - OBSERVER_WATERMARK_BOTTOM_BELOW_ZOOM_ANCHOR_PX,
                      ),
                    }
                  : { right: 12, bottom: 12 }
              }
            >
              <img src="/favicon-32x32.png" alt="" className="h-4 w-4" draggable={false} />
              <Typography.Text className="text-xs font-semibold tracking-wide text-gray-500">
                Regionify
              </Typography.Text>
            </Flex>
          )}

          {/* Arrow pan buttons */}
          {zoomControls.show && (
            <>
              <div
                className={`absolute top-0 left-1/2 -translate-x-1/2 transition-opacity duration-200 ${isTouchDevice ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              >
                <Tooltip title={t('visualizer.mapStyles.tooltipPanUp')} placement="bottom">
                  <Button
                    type="default"
                    icon={<ArrowUpOutlined />}
                    onClick={handlePanUp}
                    disabled={!selectedCountryId}
                    className="shadow-md"
                    aria-label={t('visualizer.mapStyles.tooltipPanUp')}
                  />
                </Tooltip>
              </div>
              <div
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 transition-opacity duration-200 ${isTouchDevice ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              >
                <Tooltip title={t('visualizer.mapStyles.tooltipPanDown')} placement="top">
                  <Button
                    type="default"
                    icon={<ArrowDownOutlined />}
                    onClick={handlePanDown}
                    disabled={!selectedCountryId}
                    className="shadow-md"
                    aria-label={t('visualizer.mapStyles.tooltipPanDown')}
                  />
                </Tooltip>
              </div>
              <div
                className={`absolute top-1/2 left-0 -translate-y-1/2 transition-opacity duration-200 ${isTouchDevice ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              >
                <Tooltip title={t('visualizer.mapStyles.tooltipPanLeft')} placement="right">
                  <Button
                    type="default"
                    icon={<ArrowLeftOutlined />}
                    onClick={handlePanLeft}
                    disabled={!selectedCountryId}
                    className="shadow-md"
                    aria-label={t('visualizer.mapStyles.tooltipPanLeft')}
                  />
                </Tooltip>
              </div>
              <div
                className={`absolute top-1/2 right-0 -translate-y-1/2 transition-opacity duration-200 ${isTouchDevice ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              >
                <Tooltip title={t('visualizer.mapStyles.tooltipPanRight')} placement="left">
                  <Button
                    type="default"
                    icon={<ArrowRightOutlined />}
                    onClick={handlePanRight}
                    disabled={!selectedCountryId}
                    className="shadow-md"
                    aria-label={t('visualizer.mapStyles.tooltipPanRight')}
                  />
                </Tooltip>
              </div>
            </>
          )}

          {/* Controls */}
          {zoomControls.show && (
            <Flex
              vertical
              gap={4}
              className="absolute"
              style={{ right: zoomControls.position.x, bottom: zoomControls.position.y }}
            >
              <Tooltip title={t('visualizer.mapStyles.tooltipZoomIn')} placement="left">
                <Button
                  type="default"
                  icon={<PlusOutlined />}
                  onClick={handleZoomIn}
                  disabled={!selectedCountryId}
                  className="shadow-md"
                  aria-label={t('visualizer.mapStyles.tooltipZoomIn')}
                />
              </Tooltip>
              <Tooltip title={t('visualizer.mapStyles.tooltipZoomOut')} placement="left">
                <Button
                  type="default"
                  icon={<MinusOutlined />}
                  onClick={handleZoomOut}
                  disabled={!selectedCountryId}
                  className="shadow-md"
                  aria-label={t('visualizer.mapStyles.tooltipZoomOut')}
                />
              </Tooltip>
              <Tooltip title={t('visualizer.mapStyles.tooltipResetMapAndLabels')} placement="left">
                <Button
                  type="default"
                  icon={<FullscreenOutlined />}
                  onClick={handleResetView}
                  disabled={!selectedCountryId}
                  className="shadow-md"
                  aria-label={t('visualizer.mapStyles.tooltipResetMapAndLabels')}
                />
              </Tooltip>
              <Tooltip
                title={
                  labelDragMode
                    ? t('visualizer.mapStyles.tooltipDisableLabelDragging')
                    : t('visualizer.mapStyles.tooltipEnableLabelDragging')
                }
                placement="left"
              >
                <Button
                  type={labelDragMode ? 'primary' : 'default'}
                  icon={<DragOutlined />}
                  onClick={handleToggleLabelDragMode}
                  disabled={!selectedCountryId}
                  className="shadow-md"
                  aria-label={
                    labelDragMode
                      ? t('visualizer.mapStyles.tooltipDisableLabelDragging')
                      : t('visualizer.mapStyles.tooltipEnableLabelDragging')
                  }
                />
              </Tooltip>
            </Flex>
          )}
        </Flex>

        {/* Bottom Legend (outside map container, with border separator) */}
        {isBottomLegend && legendItems.length > 0 && (
          <div
            className="p-md pt-md shrink-0 border-t border-gray-200"
            data-map-export-bottom-legend
            style={{ backgroundColor }}
          >
            <MapLegendContent
              title={title}
              labels={labels}
              legendItems={legendItems}
              noDataColor={noDataColor}
            />
          </div>
        )}
      </Flex>
    </Flex>
  );
};

export default MapViewer;
