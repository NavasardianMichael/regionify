import { useEffect, useState } from 'react';
import { MAP_THUMBNAIL_SVG_FILL } from '@/constants/data';
import { SVG_PATH_COORD_REGEX, SVG_PATH_NUMBERS_REGEX } from '@/constants/svgPath';
import { loadMapSvg } from '@/helpers/mapLoader';

/** Computes the bounding box of all `<path>` elements in an SVG DOM node. */
function computeViewBox(svgEl: SVGSVGElement): string | null {
  const paths = svgEl.querySelectorAll<SVGPathElement>('path');
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  paths.forEach((path) => {
    const d = path.getAttribute('d');
    if (!d) return;

    const coordRegex = new RegExp(SVG_PATH_COORD_REGEX.source, 'gi');
    let match;
    let cx = 0,
      cy = 0;

    while ((match = coordRegex.exec(d)) !== null) {
      const cmd = match[1].toUpperCase();
      const isRelative = match[1] === match[1].toLowerCase() && match[1] !== 'Z';
      const nums = (match[2].match(new RegExp(SVG_PATH_NUMBERS_REGEX.source, 'g')) ?? []).map(
        Number,
      );

      if (cmd === 'M' || cmd === 'L' || cmd === 'T') {
        for (let i = 0; i + 1 < nums.length; i += 2) {
          const x = isRelative ? cx + nums[i] : nums[i];
          const y = isRelative ? cy + nums[i + 1] : nums[i + 1];
          cx = x;
          cy = y;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      } else if (cmd === 'H') {
        for (const n of nums) {
          const x = isRelative ? cx + n : n;
          cx = x;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
        }
      } else if (cmd === 'V') {
        for (const n of nums) {
          const y = isRelative ? cy + n : n;
          cy = y;
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      } else if (cmd === 'C') {
        for (let i = 0; i + 5 < nums.length; i += 6) {
          const x = isRelative ? cx + nums[i + 4] : nums[i + 4];
          const y = isRelative ? cy + nums[i + 5] : nums[i + 5];
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          cx = x;
          cy = y;
        }
      }
    }
  });

  if (!isFinite(minX)) return null;
  const pad = 4;
  return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
}

export type MapThumbnailState = {
  url: string | null;
  isLoading: boolean;
};

/**
 * Loads the SVG for a region, injects a viewBox, fills paths with a muted gray,
 * and returns a data URL suitable for use in an `<img>` tag.
 */
export const useMapThumbnail = (countryId: string | null): MapThumbnailState => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!countryId) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setIsLoading(true);
    });

    loadMapSvg(countryId)
      .then((raw) => {
        if (cancelled) return;

        if (!raw) {
          setDataUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
          setIsLoading(false);
          return;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(raw, 'image/svg+xml');
        const svgEl = doc.querySelector('svg');
        if (!svgEl) {
          setDataUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
          setIsLoading(false);
          return;
        }

        const viewBox = computeViewBox(svgEl as SVGSVGElement);
        if (viewBox) svgEl.setAttribute('viewBox', viewBox);

        svgEl.querySelectorAll('path').forEach((p) => {
          p.setAttribute('fill', MAP_THUMBNAIL_SVG_FILL);
          p.removeAttribute('style');
        });

        const serialized = new XMLSerializer().serializeToString(svgEl);
        const blob = new Blob([serialized], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        if (!cancelled) {
          setDataUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
          setIsLoading(false);
        } else {
          URL.revokeObjectURL(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      setDataUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setIsLoading(false);
    };
  }, [countryId]);

  return { url: dataUrl, isLoading };
};
