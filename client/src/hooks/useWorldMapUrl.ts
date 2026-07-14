import { useEffect, useState } from 'react';

/** Precomputed bounds for `worldRussiaSplit.svg` (source file has no viewBox). */
const WORLD_MAP_VIEW_BOX = '-2.846 -4 1017.115 673.242';

let worldMapUrlPromise: Promise<string | null> | null = null;

function loadWorldMapUrl(): Promise<string | null> {
  if (!worldMapUrlPromise) {
    worldMapUrlPromise = import('@/assets/images/maps/worldRussiaSplit.svg?raw')
      .then((module) => {
        let svg = String(module.default).replace(/^\uFEFF/, '');
        svg = svg.replace(
          /<svg(\s|>)/,
          `<svg viewBox="${WORLD_MAP_VIEW_BOX}" width="1017" height="673"$1`,
        );
        // Source paths have no fill (styles stripped); default black is invisible on bg-primary.
        svg = svg.replace(/<path\b/g, '<path fill="white"');
        return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      })
      .catch((error: unknown) => {
        console.error('Failed to load world map background', error);
        return null;
      });
  }
  return worldMapUrlPromise;
}

export function useWorldMapUrl(): string | null {
  const [mapUrl, setMapUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadWorldMapUrl().then((url) => {
      if (!cancelled && url) setMapUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return mapUrl;
}
