import { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FullscreenOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Spin } from 'antd';
import { useLegendDataStore } from '@/store/legendData/store';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useVisualizerStore } from '@/store/mapData/store';
import { useMapStylesStore } from '@/store/mapStyles/store';

type MapViewerProps = {
  className?: string;
};

export const MapViewer: FC<MapViewerProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const selectedJurisdictionId = useVisualizerStore((state) => state.selectedJurisdictionId);
  const legendItemsData = useLegendDataStore((state) => state.items);
  const border = useMapStylesStore((state) => state.border);
  const shadow = useMapStylesStore((state) => state.shadow);
  const zoomControls = useMapStylesStore((state) => state.zoomControls);
  const labels = useLegendStylesStore((state) => state.labels);
  const position = useLegendStylesStore((state) => state.position);

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
        // Get the bounding box of all paths to create a proper viewBox
        const paths = svgElement.querySelectorAll('path');
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

        // Calculate bounds from path data
        paths.forEach((path) => {
          const d = path.getAttribute('d');
          if (d) {
            // Extract all numbers from path data to estimate bounds
            const numbers = d.match(/[-+]?[0-9]*\.?[0-9]+/g);
            if (numbers) {
              for (let i = 0; i < numbers.length; i += 2) {
                const x = parseFloat(numbers[i]);
                const y = parseFloat(numbers[i + 1] || '0');
                if (!isNaN(x) && !isNaN(y)) {
                  minX = Math.min(minX, x);
                  minY = Math.min(minY, y);
                  maxX = Math.max(maxX, x);
                  maxY = Math.max(maxY, y);
                }
              }
            }
          }
        });

        // Set viewBox if we found valid bounds and there's no existing viewBox
        if (
          !svgElement.getAttribute('viewBox') &&
          isFinite(minX) &&
          isFinite(minY) &&
          isFinite(maxX) &&
          isFinite(maxY)
        ) {
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

  // Load SVG content when jurisdiction changes
  useEffect(() => {
    if (!selectedJurisdictionId) {
      setSvgContent('');
      return;
    }

    const loadMap = async () => {
      setIsLoading(true);
      try {
        const mapFile = `${selectedJurisdictionId}High.svg`;
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
  }, [selectedJurisdictionId, applyStylesToSvg]);

  // Re-apply styles when map styles change - we only want this to trigger on mapStyles change
  useEffect(() => {
    if (!selectedJurisdictionId) return;

    // Reload the SVG with new styles
    const loadMap = async () => {
      try {
        const mapFile = `${selectedJurisdictionId}High.svg`;
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

  const legendPositionClasses = useMemo(() => {
    switch (position) {
      case 'floating':
        return 'top-4 right-4';
      case 'bottom':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      case 'hidden':
        return 'hidden';
      default:
        return 'top-4 right-4';
    }
  }, [position]);

  return (
    <div className={`relative h-full overflow-hidden rounded-lg bg-[#1E3A5F] ${className}`}>
      {/* Map Container - using button for accessibility */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        ref={containerRef}
        className="flex h-full w-full cursor-grab items-center justify-center active:cursor-grabbing"
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
          <div className="text-center text-white/60">
            <p className="text-lg">Select a jurisdiction to view the map</p>
          </div>
        )}
      </div>

      {/* Intensity Ratio Legend */}
      {position !== 'hidden' && labels.show && legendItems.length > 0 && (
        <div
          className={`absolute ${legendPositionClasses} p-sm rounded-lg bg-white/95 shadow-md backdrop-blur-sm`}
        >
          <div className="mb-xs gap-xs flex items-center">
            <span className="text-xs text-green-500">●</span>
            <span
              className="text-xs font-medium"
              style={{
                color: labels.color,
                fontSize: `${labels.fontSize}px`,
              }}
            >
              INTENSITY RATIO
            </span>
          </div>
          <div className="space-y-xs">
            {legendItems.map((item) => (
              <div key={item.id} className="gap-sm flex items-center">
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
                <span
                  style={{
                    color: labels.color,
                    fontSize: `${labels.fontSize}px`,
                  }}
                >
                  {item.name}
                </span>
              </div>
            ))}
            <div className="gap-sm flex items-center">
              <div className="h-3 w-3 rounded-sm border border-gray-300 bg-gray-100" />
              <span
                style={{
                  color: labels.color,
                  fontSize: `${labels.fontSize}px`,
                }}
              >
                No Data
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      {zoomControls.show && (
        <div
          className="gap-xs absolute flex flex-col"
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
        </div>
      )}
    </div>
  );
};
