import {
  type FC,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DragOutlined, FullscreenOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Spin, Typography } from 'antd';
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
import { LEGEND_POSITIONS } from '@/constants/legendStyles';
import { applySvgMapStyles } from '@/helpers/applySvgMapStyles';
import { smoothstep01 } from '@/helpers/legendColorInterpolation';
import { loadMapSvg } from '@/helpers/mapLoader';
import { MapLegendContent } from '@/components/visualizer/MapViewer/MapLegendContent';
import styles from './MapViewer.module.css';

type MapViewerProps = {
  className?: string;
};

const MapViewer: FC<MapViewerProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLButtonElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const [rawSvgContent, setRawSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [labelDragMode, setLabelDragMode] = useState(false);

  // Legend drag state - use refs for smooth animation without re-renders
  const [isLegendDragging, setIsLegendDragging] = useState(false);
  const legendDragStartRef = useRef({ x: 0, y: 0 });
  const legendOffsetRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

  // Legend resize state
  const [isLegendResizing, setIsLegendResizing] = useState(false);
  const resizeStartRef = useRef({ x: 0, width: 0 });
  const currentWidthRef = useRef(0);

  // Region label drag state
  const labelPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const prevSelectedCountryIdRef = useRef<string | null>(null);
  const draggingLabelRef = useRef<{
    element: SVGTextElement;
    svgElement: SVGSVGElement;
    regionId: string;
  } | null>(null);

  const selectedCountryId = useVisualizerStore(selectSelectedCountryId);
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
        labelPositions: labelPositionsRef.current,
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

  // Always sync local draft with persisted positions for the active map.
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

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleToggleLabelDragMode = useCallback(() => {
    setLabelDragMode((prev) => !prev);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (labelDragMode) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pan, labelDragMode],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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
    (e: MouseEvent) => {
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
    (e: MouseEvent) => {
      const dragging = draggingLabelRef.current;
      if (!dragging) return;

      const svgCoords = screenToSvgCoords(dragging.svgElement, e.clientX, e.clientY);
      if (svgCoords) {
        labelPositionsRef.current[dragging.regionId] = { x: svgCoords.x, y: svgCoords.y };
        setLabelPositionsByRegionId({ ...labelPositionsRef.current });
      }

      draggingLabelRef.current = null;
      window.removeEventListener('mousemove', handleLabelDragMove);
      window.removeEventListener('mouseup', handleLabelDragEnd);
    },
    [screenToSvgCoords, handleLabelDragMove, setLabelPositionsByRegionId],
  );

  // Attach drag handlers to SVG region label text elements after render
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !svgContent || !regionLabels.show || !labelDragMode) return;

    const svgEl = container.querySelector('svg');
    if (!svgEl) return;

    const textElements = svgEl.querySelectorAll<SVGTextElement>('text[data-region-id]');

    const handleMouseDown = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const target = e.currentTarget as SVGTextElement;
      const regionId = target.getAttribute('data-region-id');
      if (!regionId) return;

      draggingLabelRef.current = {
        element: target,
        svgElement: svgEl,
        regionId,
      };

      window.addEventListener('mousemove', handleLabelDragMove);
      window.addEventListener('mouseup', handleLabelDragEnd);
    };

    textElements.forEach((el) => {
      el.addEventListener('mousedown', handleMouseDown);
    });

    return () => {
      textElements.forEach((el) => {
        el.removeEventListener('mousedown', handleMouseDown);
      });
    };
  }, [svgContent, regionLabels.show, labelDragMode, handleLabelDragMove, handleLabelDragEnd]);

  // Legend drag handlers - optimized with CSS transforms and requestAnimationFrame
  const handleLegendMouseDown = useCallback(
    (e: React.MouseEvent) => {
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
    (e: MouseEvent) => {
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

      if (isLegendResizing && legendRef.current) {
        const newWidth = Math.max(
          120,
          resizeStartRef.current.width + (e.clientX - resizeStartRef.current.x),
        );
        currentWidthRef.current = newWidth;

        // Apply width directly via transform scale or width
        if (rafIdRef.current === null) {
          rafIdRef.current = requestAnimationFrame(() => {
            if (legendRef.current) {
              legendRef.current.style.width = `${currentWidthRef.current}px`;
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

    // Commit final width to store
    if (isLegendResizing && currentWidthRef.current > 0) {
      setLegendStylesState({ floatingSize: { ...floatingSize, width: currentWidthRef.current } });
      currentWidthRef.current = 0;
    }

    setIsLegendDragging(false);
    setIsLegendResizing(false);
  }, [isLegendDragging, isLegendResizing, floatingPosition, floatingSize, setLegendStylesState]);

  // Legend resize handler
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      setIsLegendResizing(true);
      resizeStartRef.current = { x: e.clientX, width: floatingSize.width };
      currentWidthRef.current = floatingSize.width;

      if (legendRef.current) {
        legendRef.current.style.willChange = 'width';
      }
    },
    [floatingSize.width],
  );

  // Add global mouse event listeners for legend drag/resize
  useEffect(() => {
    if (isLegendDragging || isLegendResizing) {
      window.addEventListener('mousemove', handleLegendMouseMove);
      window.addEventListener('mouseup', handleLegendMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleLegendMouseMove);
        window.removeEventListener('mouseup', handleLegendMouseUp);
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

  return (
    <Flex vertical className={`h-full ${className}`}>
      {/* Map Container */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg"
        style={{
          backgroundColor: picture.transparentBackground ? 'transparent' : picture.backgroundColor,
        }}
      >
        <button
          type="button"
          ref={containerRef}
          aria-label={selectedCountryId ? `Map of ${selectedCountryId}` : 'No country selected'}
          className={`absolute inset-0 flex items-center justify-center border-none bg-transparent p-0 ${
            labelDragMode ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {isLoading ? (
            <Spin size="large" />
          ) : svgContent ? (
            <>
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  width: '80%',
                  height: '80%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="map-svg-container [&>svg]:h-full [&>svg]:w-full [&>svg]:object-contain"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
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
            className={`absolute ${legendPositionClasses} p-sm cursor-move rounded-lg shadow-[0_0_1px_rgba(24,41,77,0.3)] backdrop-blur-sm transition-shadow duration-200 select-none hover:shadow-[0_0_4px_rgba(24,41,77,0.3)]`}
            style={{
              left: floatingPosition.x,
              top: floatingPosition.y,
              width: floatingSize.width,
              backgroundColor,
            }}
          >
            {/* Invisible drag handle overlay */}
            <button
              type="button"
              aria-label="Drag to reposition legend"
              className="absolute inset-0 z-10 cursor-move border-none bg-transparent p-0"
              onMouseDown={handleLegendMouseDown}
            />
            <div className="pointer-events-none relative z-20">
              <MapLegendContent
                title={title}
                labels={labels}
                legendItems={legendItems}
                noDataColor={noDataColor}
              />
            </div>
            {/* Resize handle for floating legend */}
            <button
              type="button"
              aria-label="Resize legend width"
              className="absolute -right-1 -bottom-1 z-20 h-6 w-6 cursor-se-resize rounded-bl-lg border-none bg-transparent p-0 transition-colors hover:bg-gray-100"
              onMouseDown={handleResizeMouseDown}
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

        {/* Zoom Controls */}
        {zoomControls.show && (
          <Flex
            vertical
            gap={4}
            className="absolute"
            style={{ right: zoomControls.position.x, bottom: zoomControls.position.y }}
          >
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={handleZoomIn}
              className="shadow-md"
              aria-label="Zoom in"
            />
            <Button
              type="default"
              icon={<MinusOutlined />}
              onClick={handleZoomOut}
              className="shadow-md"
              aria-label="Zoom out"
            />
            <Button
              type="default"
              icon={<FullscreenOutlined />}
              onClick={handleResetView}
              className="shadow-md"
              aria-label="Reset view"
            />
            <Button
              type={labelDragMode ? 'primary' : 'default'}
              icon={<DragOutlined />}
              onClick={handleToggleLabelDragMode}
              className="shadow-md"
              aria-label={labelDragMode ? 'Disable label dragging' : 'Enable label dragging'}
              title={labelDragMode ? 'Disable label dragging' : 'Drag region labels'}
            />
          </Flex>
        )}
      </div>

      {/* Bottom Legend (outside map container, with border separator) */}
      {isBottomLegend && legendItems.length > 0 && (
        <div className="p-md pt-md shrink-0 border-t border-gray-200" style={{ backgroundColor }}>
          <MapLegendContent
            title={title}
            labels={labels}
            legendItems={legendItems}
            noDataColor={noDataColor}
          />
        </div>
      )}
    </Flex>
  );
};

export default MapViewer;
