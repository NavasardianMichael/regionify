import { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FullscreenOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Spin, Typography } from 'antd';
import { selectLegendItems, useLegendDataStore } from '@/store/legendData/store';
import {
  selectBackgroundColor,
  selectFloatingPosition,
  selectFloatingSize,
  selectLabels,
  selectPosition,
  selectSetLegendStylesState,
  selectTitle,
  useLegendStylesStore,
} from '@/store/legendStyles/store';
import { selectSelectedRegionId, useVisualizerStore } from '@/store/mapData/store';
import {
  selectBorder,
  selectShadow,
  selectZoomControls,
  useMapStylesStore,
} from '@/store/mapStyles/store';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';

type MapViewerProps = {
  className?: string;
};

const MapViewer: FC<MapViewerProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
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

  const selectedRegionId = useVisualizerStore(selectSelectedRegionId);
  const legendItemsData = useLegendDataStore(selectLegendItems);
  const border = useMapStylesStore(selectBorder);
  const shadow = useMapStylesStore(selectShadow);
  const zoomControls = useMapStylesStore(selectZoomControls);
  const labels = useLegendStylesStore(selectLabels);
  const title = useLegendStylesStore(selectTitle);
  const position = useLegendStylesStore(selectPosition);
  const floatingPosition = useLegendStylesStore(selectFloatingPosition);
  const floatingSize = useLegendStylesStore(selectFloatingSize);
  const backgroundColor = useLegendStylesStore(selectBackgroundColor);
  const setLegendStylesState = useLegendStylesStore(selectSetLegendStylesState);

  const legendItems = useMemo(
    () => legendItemsData.allIds.map((id) => legendItemsData.byId[id]),
    [legendItemsData.allIds, legendItemsData.byId],
  );

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
        if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
          const padding = 10;
          const width = maxX - minX + padding * 2;
          const height = maxY - minY + padding * 2;
          svgElement.setAttribute(
            'viewBox',
            `${minX - padding} ${minY - padding} ${width} ${height}`,
          );
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
          if (border.show) {
            path.style.stroke = border.color;
            path.style.strokeWidth = String(border.width);
          } else {
            path.style.stroke = 'none';
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

        return new XMLSerializer().serializeToString(doc);
      }

      return svg;
    },
    [border, shadow],
  );

  // Load SVG content when region changes
  useEffect(() => {
    if (!selectedRegionId) {
      setSvgContent('');
      return;
    }

    const loadMap = async () => {
      setIsLoading(true);
      try {
        const mapFile = `${selectedRegionId}High.svg`;
        const response = await fetch(`/src/assets/images/maps/${mapFile}`);
        if (response.ok) {
          let svg = await response.text();
          // Apply styles to SVG
          svg = applyStylesToSvg(svg);
          setSvgContent(svg);
        }
      } catch (error) {
        console.error('Failed to load map:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMap();
  }, [selectedRegionId, applyStylesToSvg]);

  // Re-apply styles when map styles change - we only want this to trigger on mapStyles change
  useEffect(() => {
    if (!selectedRegionId) return;

    // Reload the SVG with new styles
    const loadMap = async () => {
      try {
        const mapFile = `${selectedRegionId}High.svg`;
        const response = await fetch(`/src/assets/images/maps/${mapFile}`);
        if (response.ok) {
          let svg = await response.text();
          svg = applyStylesToSvg(svg);
          setSvgContent(svg);
        }
      } catch (error) {
        console.error('Failed to reload map:', error);
      }
    };
    loadMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [border, shadow]);

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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.min(Math.max(prev * delta, 0.5), 5));
  }, []);

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
          <div className="h-3 w-3 shrink-0 rounded-sm border border-gray-300 bg-gray-100" />
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
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg">
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          ref={containerRef}
          className="absolute inset-0 flex cursor-grab items-center justify-center active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {isLoading ? (
            <Spin size="large" />
          ) : svgContent ? (
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
          ) : (
            <Flex vertical align="center" justify="center" className="text-white/60">
              <Typography.Text className="text-lg text-white/60">
                Select a region to view the map
              </Typography.Text>
            </Flex>
          )}
        </div>

        {/* Floating Legend (inside map container) */}
        {position === LEGEND_POSITIONS.floating && labels.show && legendItems.length > 0 && (
          <div
            ref={legendRef}
            className={`absolute ${legendPositionClasses} p-sm cursor-move rounded-lg shadow-[0_0_1px_rgba(24,41,77,0.3)] backdrop-blur-sm transition-shadow duration-200 select-none hover:shadow-[0_0_4px_rgba(24,41,77,0.3)]`}
            style={{
              left: floatingPosition.x,
              top: floatingPosition.y,
              width: floatingSize.width,
              backgroundColor,
            }}
            onMouseDown={handleLegendMouseDown}
          >
            {legendContent}
            {/* Resize handle for floating legend */}
            <div
              role="slider"
              tabIndex={0}
              aria-label="Resize legend"
              aria-valuemin={120}
              aria-valuemax={400}
              aria-valuenow={floatingSize.width}
              className="absolute -right-1 -bottom-1 h-6 w-6 cursor-se-resize rounded-bl-lg transition-colors hover:bg-gray-100"
              onMouseDown={handleResizeMouseDown}
            >
              <svg
                className="h-full w-full p-1 text-gray-400"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
              </svg>
            </div>
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
            />
            <Button
              type="default"
              icon={<MinusOutlined />}
              onClick={handleZoomOut}
              className="shadow-md"
            />
            <Button
              type="default"
              icon={<FullscreenOutlined />}
              onClick={handleResetView}
              className="shadow-md"
            />
          </Flex>
        )}
      </div>

      {/* Bottom Legend (outside map container, with border separator) */}
      {isBottomLegend && labels.show && legendItems.length > 0 && (
        <div className="p-md pt-md shrink-0 border-t border-gray-200" style={{ backgroundColor }}>
          {legendContent}
        </div>
      )}
    </Flex>
  );
};

export default MapViewer;
