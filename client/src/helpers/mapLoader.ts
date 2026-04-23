/**
 * Lazy-load SVG maps from src/assets/images/maps using Vite's import.meta.glob
 * This enables code-splitting and proper bundling for production builds.
 */

// Lazy import all SVG files as raw strings
const svgModules = import.meta.glob<string>('@/assets/images/maps/*.svg', {
  query: '?raw',
  import: 'default',
});

/**
 * Get the module path key for a given region ID
 */
const getModulePath = (regionId: string): string => {
  return `/src/assets/images/maps/${regionId}.svg`;
};

/**
 * Load SVG content for a specific region
 * @param regionId - The region identifier (filename without .svg extension)
 * @returns Promise resolving to SVG content string, or null if not found
 */
export const loadMapSvg = async (regionId: string): Promise<string | null> => {
  const modulePath = getModulePath(regionId);
  const loader = svgModules[modulePath];

  if (!loader) {
    console.warn(`Map not found: ${regionId}`);
    return null;
  }

  try {
    const svgContent = await loader();
    return svgContent;
  } catch (error) {
    console.error(`Failed to load map: ${regionId}`, error);
    return null;
  }
};

/**
 * Check if a map exists for the given region ID
 */
export const hasMap = (regionId: string): boolean => {
  const modulePath = getModulePath(regionId);
  return modulePath in svgModules;
};

/**
 * Get list of all available region IDs
 */
export const getAvailableRegionIds = (): string[] => {
  return Object.keys(svgModules)
    .map((path) => {
      const match = path.match(/\/([^/]+)\.svg$/);
      return match ? match[1] : '';
    })
    .filter(Boolean);
};
