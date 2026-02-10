import {
  type FC,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FullscreenOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Spin, Typography } from 'antd';
import DOMPurify from 'dompurify';
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
  selectData,
  selectActiveTimePeriod,
  selectSelectedRegionId,
  selectTimePeriods,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { selectTransitionType } from '@/store/animation/selectors';
import { useAnimationStore } from '@/store/animation/store';
import {
  selectBorder,
  selectPicture,
  selectRegionLabels,
  selectShadow,
  selectZoomControls,
} from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';
import { loadMapSvg } from '@/helpers/mapLoader';
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
  const draggingLabelRef = useRef<{
    element: SVGTextElement;
    svgElement: SVGSVGElement;
    regionId: string;
  } | null>(null);

  const selectedRegionId = useVisualizerStore(selectSelectedRegionId);
  const data = useVisualizerStore(selectData);
  const activeTimePeriod = useVisualizerStore(selectActiveTimePeriod);
  const timePeriods = useVisualizerStore(selectTimePeriods);
  const transitionType = useAnimationStore(selectTransitionType);
  const legendItemsData = useLegendDataStore(selectLegendItems);
  const border = useMapStylesStore(selectBorder);
  const shadow = useMapStylesStore(selectShadow);
  const zoomControls = useMapStylesStore(selectZoomControls);
  const picture = useMapStylesStore(selectPicture);
  const regionLabels = useMapStylesStore(selectRegionLabels);
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

  const applyStylesToSvg = useCallback(
    (svg: string) => {
      // Parse and modify SVG to apply border styles
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');

      if (svgElement) {
        // Calculate viewBox from actual path bounding boxes using getBBox simulation
        // We need to find the actual bounds of all paths
        const paths = svgElement.querySelectorAll('path');
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

        // Parse SVG path data to get actual coordinates
        paths.forEach((path) => {
          const d = path.getAttribute('d');
          if (d) {
            // Parse path commands properly - extract coordinates from M, L, C, etc.
            // Match coordinate pairs after commands like M, L, H, V, C, S, Q, T, A, Z
            const coordRegex = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi;
            let match;
            let currentX = 0;
            let currentY = 0;

            while ((match = coordRegex.exec(d)) !== null) {
              const command = match[1];
              const params = match[2].trim();
              const numbers = params.match(/[-+]?[0-9]*\.?[0-9]+/g)?.map(Number) || [];

              const isRelative = command === command.toLowerCase();
              const cmd = command.toUpperCase();

              if (cmd === 'M' || cmd === 'L' || cmd === 'T') {
                for (let i = 0; i < numbers.length; i += 2) {
                  const x = isRelative ? currentX + numbers[i] : numbers[i];
                  const y = isRelative ? currentY + (numbers[i + 1] ?? 0) : (numbers[i + 1] ?? 0);
                  currentX = x;
                  currentY = y;
                  minX = Math.min(minX, x);
                  minY = Math.min(minY, y);
                  maxX = Math.max(maxX, x);
                  maxY = Math.max(maxY, y);
                }
              } else if (cmd === 'H') {
                for (const num of numbers) {
                  const x = isRelative ? currentX + num : num;
                  currentX = x;
                  minX = Math.min(minX, x);
                  maxX = Math.max(maxX, x);
                }
              } else if (cmd === 'V') {
                for (const num of numbers) {
                  const y = isRelative ? currentY + num : num;
                  currentY = y;
                  minY = Math.min(minY, y);
                  maxY = Math.max(maxY, y);
                }
              } else if (cmd === 'C') {
                // Cubic bezier: x1 y1 x2 y2 x y
                for (let i = 0; i < numbers.length; i += 6) {
                  for (let j = 0; j < 6; j += 2) {
                    const x = isRelative ? currentX + numbers[i + j] : numbers[i + j];
                    const y = isRelative
                      ? currentY + (numbers[i + j + 1] ?? 0)
                      : (numbers[i + j + 1] ?? 0);
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                  }
                  currentX = isRelative ? currentX + numbers[i + 4] : numbers[i + 4];
                  currentY = isRelative ? currentY + (numbers[i + 5] ?? 0) : (numbers[i + 5] ?? 0);
                }
              } else if (cmd === 'S' || cmd === 'Q') {
                // Smooth cubic/quadratic: (x1 y1) x y
                const step = cmd === 'S' ? 4 : 4;
                for (let i = 0; i < numbers.length; i += step) {
                  for (let j = 0; j < step; j += 2) {
                    const x = isRelative ? currentX + numbers[i + j] : numbers[i + j];
                    const y = isRelative
                      ? currentY + (numbers[i + j + 1] ?? 0)
                      : (numbers[i + j + 1] ?? 0);
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                  }
                  currentX = isRelative ? currentX + numbers[i + step - 2] : numbers[i + step - 2];
                  currentY = isRelative
                    ? currentY + (numbers[i + step - 1] ?? 0)
                    : (numbers[i + step - 1] ?? 0);
                }
              }
            }
          }
        });

        // Always set viewBox based on calculated bounds
        let viewBoxX = 0,
          viewBoxY = 0,
          viewBoxWidth = 0,
          viewBoxHeight = 0;
        if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
          const padding = 10;
          viewBoxWidth = maxX - minX + padding * 2;
          viewBoxHeight = maxY - minY + padding * 2;
          viewBoxX = minX - padding;
          viewBoxY = minY - padding;
          svgElement.setAttribute(
            'viewBox',
            `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`,
          );
        }

        // Add background rectangle if not transparent
        if (!picture.transparentBackground && viewBoxWidth > 0 && viewBoxHeight > 0) {
          // Remove existing background rect if any
          const existingBg = svgElement.querySelector('#mapBackground');
          if (existingBg) {
            existingBg.remove();
          }

          const bgRect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
          bgRect.setAttribute('id', 'mapBackground');
          bgRect.setAttribute('x', String(viewBoxX));
          bgRect.setAttribute('y', String(viewBoxY));
          bgRect.setAttribute('width', String(viewBoxWidth));
          bgRect.setAttribute('height', String(viewBoxHeight));
          bgRect.setAttribute('fill', picture.backgroundColor);
          // Insert as first child so it's behind everything
          svgElement.insertBefore(bgRect, svgElement.firstChild);
        }

        // Set SVG to be responsive - remove fixed dimensions
        svgElement.removeAttribute('width');
        svgElement.removeAttribute('height');

        // Preserve aspect ratio
        if (!svgElement.getAttribute('preserveAspectRatio')) {
          svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }

        // Remove or override the internal style that might conflict
        const styleElement = svgElement.querySelector('style');
        if (styleElement) {
          // Update the CSS in the style element to use our colors
          let cssText = styleElement.textContent || '';
          // Replace stroke properties
          if (border.show) {
            cssText = cssText.replace(/stroke\s*:\s*[^;]+;/g, `stroke: ${border.color};`);
            cssText = cssText.replace(
              /stroke-width\s*:\s*[^;]+;/g,
              `stroke-width: ${border.width};`,
            );
          } else {
            cssText = cssText.replace(/stroke\s*:\s*[^;]+;/g, 'stroke: none;');
          }
          styleElement.textContent = cssText;
        }

        // Also apply inline styles to ensure they take precedence
        paths.forEach((path) => {
          // Apply static styles from CSS module
          path.classList.add(styles.mapPath);

          // Disable CSS transition for instant mode
          if (transitionType === 'instant') {
            path.classList.add(styles.mapPathInstant);
          }

          // Apply dynamic border styles
          if (border.show) {
            path.style.stroke = border.color;
            path.style.strokeWidth = String(border.width);
          } else {
            path.style.stroke = 'none';
          }

          // Apply fill color based on region data and legend
          const pathTitle = path.getAttribute('title');
          if (pathTitle) {
            const regionData = data.byId[pathTitle];
            if (regionData) {
              // Find matching legend item based on value range
              const matchingLegendItem = deferredLegendItems.find(
                (item) => regionData.value >= item.min && regionData.value <= item.max,
              );
              path.style.fill = matchingLegendItem ? matchingLegendItem.color : noDataColor;
            } else {
              // No data for this region
              path.style.fill = noDataColor;
            }
          }
        });

        // Apply shadow if enabled
        if (shadow.show) {
          // Remove existing shadow filter if any
          const existingFilter = svgElement.querySelector('#mapShadow');
          if (existingFilter) {
            existingFilter.remove();
          }

          const defs =
            svgElement.querySelector('defs') ||
            doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
          if (!svgElement.querySelector('defs')) {
            svgElement.insertBefore(defs, svgElement.firstChild);
          }

          const filter = doc.createElementNS('http://www.w3.org/2000/svg', 'filter');
          filter.setAttribute('id', 'mapShadow');
          filter.innerHTML = `
            <feDropShadow 
              dx="${shadow.offsetX}" 
              dy="${shadow.offsetY}" 
              stdDeviation="${shadow.blur / 2}" 
              flood-color="${shadow.color}"
              flood-opacity="0.3"
            />
          `;
          defs.appendChild(filter);

          // Apply filter to a group containing all paths
          const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.setAttribute('filter', 'url(#mapShadow)');

          // Move all path elements into the group
          const pathsToMove = Array.from(svgElement.querySelectorAll('g > path, svg > path'));
          pathsToMove.forEach((path) => g.appendChild(path));
          svgElement.appendChild(g);
        }

        // Add region labels if enabled
        if (regionLabels.show && data.allIds.length > 0) {
          // Remove existing labels group if any
          const existingLabelsGroup = svgElement.querySelector('#regionLabelsGroup');
          if (existingLabelsGroup) {
            existingLabelsGroup.remove();
          }

          const labelsGroup = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
          labelsGroup.setAttribute('id', 'regionLabelsGroup');

          paths.forEach((path) => {
            const pathTitle = path.getAttribute('title');
            if (!pathTitle) return;

            // Check if we have data for this region
            const regionData = data.byId[pathTitle];
            if (!regionData) return;

            // Use stored position if available, otherwise calculate centroid
            const storedPos = labelPositionsRef.current[pathTitle];
            let labelX: number;
            let labelY: number;

            if (storedPos) {
              labelX = storedPos.x;
              labelY = storedPos.y;
            } else {
              // Calculate centroid using bounding box approximation
              const d = path.getAttribute('d');
              if (!d) return;

              let rMinX = Infinity,
                rMinY = Infinity,
                rMaxX = -Infinity,
                rMaxY = -Infinity;
              const coordRegex = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi;
              let match;
              let cX = 0,
                cY = 0;

              while ((match = coordRegex.exec(d)) !== null) {
                const command = match[1];
                const params = match[2].trim();
                const numbers = params.match(/[-+]?[0-9]*\.?[0-9]+/g)?.map(Number) || [];
                const isRelative = command === command.toLowerCase();
                const cmd = command.toUpperCase();

                if (cmd === 'M' || cmd === 'L' || cmd === 'T') {
                  for (let i = 0; i < numbers.length; i += 2) {
                    const x = isRelative ? cX + numbers[i] : numbers[i];
                    const y = isRelative ? cY + (numbers[i + 1] ?? 0) : (numbers[i + 1] ?? 0);
                    cX = x;
                    cY = y;
                    rMinX = Math.min(rMinX, x);
                    rMinY = Math.min(rMinY, y);
                    rMaxX = Math.max(rMaxX, x);
                    rMaxY = Math.max(rMaxY, y);
                  }
                } else if (cmd === 'H') {
                  for (const num of numbers) {
                    const x = isRelative ? cX + num : num;
                    cX = x;
                    rMinX = Math.min(rMinX, x);
                    rMaxX = Math.max(rMaxX, x);
                  }
                } else if (cmd === 'V') {
                  for (const num of numbers) {
                    const y = isRelative ? cY + num : num;
                    cY = y;
                    rMinY = Math.min(rMinY, y);
                    rMaxY = Math.max(rMaxY, y);
                  }
                } else if (cmd === 'C') {
                  for (let i = 0; i < numbers.length; i += 6) {
                    for (let j = 0; j < 6; j += 2) {
                      const x = isRelative ? cX + numbers[i + j] : numbers[i + j];
                      const y = isRelative
                        ? cY + (numbers[i + j + 1] ?? 0)
                        : (numbers[i + j + 1] ?? 0);
                      rMinX = Math.min(rMinX, x);
                      rMinY = Math.min(rMinY, y);
                      rMaxX = Math.max(rMaxX, x);
                      rMaxY = Math.max(rMaxY, y);
                    }
                    cX = isRelative ? cX + numbers[i + 4] : numbers[i + 4];
                    cY = isRelative ? cY + (numbers[i + 5] ?? 0) : (numbers[i + 5] ?? 0);
                  }
                }
              }

              if (!isFinite(rMinX) || !isFinite(rMinY) || !isFinite(rMaxX) || !isFinite(rMaxY))
                return;

              labelX = (rMinX + rMaxX) / 2;
              labelY = (rMinY + rMaxY) / 2;
            }

            // Create draggable text element
            const text = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', String(labelX));
            text.setAttribute('y', String(labelY));
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', regionLabels.color);
            text.setAttribute('font-size', String(regionLabels.fontSize));
            text.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
            text.setAttribute('data-region-id', pathTitle);
            text.setAttribute('cursor', 'move');
            text.textContent = regionData.label;

            labelsGroup.appendChild(text);
          });

          svgElement.appendChild(labelsGroup);
        }

        return new XMLSerializer().serializeToString(doc);
      }

      return svg;
    },
    [border, shadow, picture, regionLabels, data, deferredLegendItems, noDataColor, transitionType],
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

  // Load raw SVG content only when region changes
  useEffect(() => {
    if (!selectedRegionId) {
      setRawSvgContent('');
      setZoom(1);
      setPan({ x: 0, y: 0 });
      labelPositionsRef.current = {};
      return;
    }

    const loadMap = async () => {
      setIsLoading(true);
      try {
        const svg = await loadMapSvg(selectedRegionId);
        if (svg) {
          setRawSvgContent(svg);
        }
      } catch (error) {
        console.error('Failed to load map:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Reset view and label positions when loading new region
    setZoom(1);
    setPan({ x: 0, y: 0 });
    labelPositionsRef.current = {};
    loadMap();
  }, [selectedRegionId]);

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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pan],
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
      }

      draggingLabelRef.current = null;
      window.removeEventListener('mousemove', handleLabelDragMove);
      window.removeEventListener('mouseup', handleLabelDragEnd);
    },
    [screenToSvgCoords, handleLabelDragMove],
  );

  // Attach drag handlers to SVG region label text elements after render
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !svgContent || !regionLabels.show) return;

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
  }, [svgContent, regionLabels.show, handleLabelDragMove, handleLabelDragEnd]);

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

  // Render legend content (shared between floating and bottom positions)
  const legendContent = (
    <>
      {title.show && (
        <Flex align="center" gap={4} className="mb-xs">
          <Typography.Text className="text-xs text-green-500">●</Typography.Text>
          <Typography.Text
            className="text-xs font-medium"
            style={{
              color: labels.color,
              fontSize: `${labels.fontSize}px`,
            }}
          >
            {title.text}
          </Typography.Text>
        </Flex>
      )}
      <Flex vertical gap="small">
        {legendItems.map((item) => (
          <Flex key={item.id} align="center" gap="small">
            <div className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
            <Typography.Text
              className="truncate"
              style={{
                color: labels.color,
                fontSize: `${labels.fontSize}px`,
              }}
            >
              {item.name}
            </Typography.Text>
          </Flex>
        ))}
        <Flex align="center" gap="small">
          <div
            className="h-3 w-3 shrink-0 rounded-sm border border-gray-300"
            style={{ backgroundColor: noDataColor }}
          />
          <Typography.Text
            style={{
              color: labels.color,
              fontSize: `${labels.fontSize}px`,
            }}
          >
            No Data
          </Typography.Text>
        </Flex>
      </Flex>
    </>
  );

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
          aria-label={selectedRegionId ? `Map of ${selectedRegionId}` : 'No region selected'}
          className="absolute inset-0 flex cursor-grab items-center justify-center border-none bg-transparent p-0 active:cursor-grabbing"
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
                Select a region to view the map
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
            <div className="pointer-events-none relative z-20">{legendContent}</div>
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
          </Flex>
        )}
      </div>

      {/* Bottom Legend (outside map container, with border separator) */}
      {isBottomLegend && legendItems.length > 0 && (
        <div className="p-md pt-md shrink-0 border-t border-gray-200" style={{ backgroundColor }}>
          {legendContent}
        </div>
      )}
    </Flex>
  );
};

export default MapViewer;
