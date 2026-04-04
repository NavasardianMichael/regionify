import {
  type RefObject,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import DOMPurify from 'dompurify';
import { useShallow } from 'zustand/react/shallow';
import { selectPlaybackPreviewBlend, selectTransitionType } from '@/store/animation/selectors';
import { useAnimationStore } from '@/store/animation/store';
import { selectItemsList } from '@/store/legendData/selectors';
import { useLegendDataStore } from '@/store/legendData/store';
import { selectNoDataColor } from '@/store/legendStyles/selectors';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { selectData, selectSelectedCountryId, selectTimelineData } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import {
  selectBorder,
  selectLabelPositionsByRegionId,
  selectPicture,
  selectRegionLabels,
  selectSetLabelPositionsByRegionId,
  selectShadow,
} from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { applySvgMapStyles } from '@/helpers/applySvgMapStyles';
import { smoothstep01 } from '@/helpers/legendColorInterpolation';
import { loadMapSvg } from '@/helpers/mapLoader';
import styles from '../MapViewer.module.css';

type UseMapSvgReturn = {
  svgContent: string;
  isLoading: boolean;
  labelPositionsRef: RefObject<Record<string, { x: number; y: number }>>;
};

export function useMapSvg(): UseMapSvgReturn {
  const selectedCountryId = useVisualizerStore(selectSelectedCountryId);
  const data = useVisualizerStore(selectData);
  const timelineData = useVisualizerStore(selectTimelineData);
  const transitionType = useAnimationStore(selectTransitionType);
  const playbackPreviewBlend = useAnimationStore(selectPlaybackPreviewBlend);
  const legendItems = useLegendDataStore(useShallow(selectItemsList));
  const border = useMapStylesStore(selectBorder);
  const shadow = useMapStylesStore(selectShadow);
  const picture = useMapStylesStore(selectPicture);
  const regionLabels = useMapStylesStore(selectRegionLabels);
  const labelPositionsByRegionId = useMapStylesStore(selectLabelPositionsByRegionId);
  const setLabelPositionsByRegionId = useMapStylesStore(selectSetLabelPositionsByRegionId);
  const noDataColor = useLegendStylesStore(selectNoDataColor);

  const [rawSvgContent, setRawSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const labelPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const prevSelectedCountryIdRef = useRef<string | null>(null);

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

  // Keep ref in sync for label-drag mouseup (batch into store)
  useEffect(() => {
    if (rawSvgContent) {
      labelPositionsRef.current = { ...labelPositionsByRegionId };
    }
  }, [rawSvgContent, labelPositionsByRegionId]);

  // Load raw SVG content when region changes
  useEffect(() => {
    if (!selectedCountryId) {
      setRawSvgContent('');
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

    labelPositionsRef.current = {};
    loadMap();
  }, [selectedCountryId]);

  return { svgContent, isLoading, labelPositionsRef };
}
