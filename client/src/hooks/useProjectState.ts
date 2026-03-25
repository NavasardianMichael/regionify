import { useMemo } from 'react';
import type {
  ProjectCreatePayload,
  ProjectDataset,
  ProjectLegendData,
  ProjectLegendStyles,
  ProjectMapStyles,
} from '@/api/projects/types';
import { useLegendDataStore } from '@/store/legendData/store';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useVisualizerStore } from '@/store/mapData/store';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectSavedStateSnapshot } from '@/store/projects/selectors';
import { useProjectsStore } from '@/store/projects/store';
import { IMPORT_DATA_TYPES } from '@/constants/data';

/**
 * Builds a serializable snapshot of the current visualizer state
 * (all stores combined, actions excluded).
 */
function buildStateSnapshot(): string {
  const { selectedCountryId, importDataType, data, google } = useVisualizerStore.getState();
  const { border, shadow, zoomControls, picture, regionLabels } = useMapStylesStore.getState();
  const { labels, title, position, floatingPosition, floatingSize, backgroundColor, noDataColor } =
    useLegendStylesStore.getState();
  const { items } = useLegendDataStore.getState();

  const hasData = data.allIds.length > 0;

  const dataset: ProjectDataset | null = hasData
    ? {
        allIds: data.allIds,
        byId: data.byId,
        importDataType,
        ...(importDataType === IMPORT_DATA_TYPES.sheets && google.url
          ? { google: { url: google.url, gid: google.gid } }
          : {}),
      }
    : null;

  const mapStyles: ProjectMapStyles = {
    border,
    shadow,
    zoomControls,
    picture,
    regionLabels,
  };

  const legendStyles: ProjectLegendStyles = {
    labels,
    title,
    position,
    floatingPosition,
    floatingSize,
    backgroundColor,
    noDataColor,
  };

  const legendData: ProjectLegendData = {
    items: items.allIds.map((id) => items.byId[id]),
  };

  return JSON.stringify({
    countryId: selectedCountryId,
    dataset,
    mapStyles,
    legendStyles,
    legendData,
  });
}

/**
 * Returns the current project payload ready for API save.
 * Pass `name` to include it (for create), omit for updates.
 */
export function getProjectPayload(name?: string): ProjectCreatePayload {
  const snapshot = JSON.parse(buildStateSnapshot()) as Omit<ProjectCreatePayload, 'name'>;
  return { name: name ?? '', ...snapshot };
}

/**
 * Captures the current state as the "saved" baseline.
 */
export function captureStateSnapshot(): string {
  return buildStateSnapshot();
}

/**
 * Hook that reactively computes whether the current visualizer state
 * differs from the last saved/loaded project snapshot.
 */
export function useHasUnsavedChanges(): boolean {
  const savedSnapshot = useProjectsStore(selectSavedStateSnapshot);

  // Subscribe to each store slice so the hook re-runs on any change
  const selectedCountryId = useVisualizerStore((s) => s.selectedCountryId);
  const importDataType = useVisualizerStore((s) => s.importDataType);
  const data = useVisualizerStore((s) => s.data);
  const google = useVisualizerStore((s) => s.google);
  const border = useMapStylesStore((s) => s.border);
  const shadow = useMapStylesStore((s) => s.shadow);
  const zoomControls = useMapStylesStore((s) => s.zoomControls);
  const picture = useMapStylesStore((s) => s.picture);
  const regionLabels = useMapStylesStore((s) => s.regionLabels);
  const labels = useLegendStylesStore((s) => s.labels);
  const title = useLegendStylesStore((s) => s.title);
  const position = useLegendStylesStore((s) => s.position);
  const floatingPosition = useLegendStylesStore((s) => s.floatingPosition);
  const floatingSize = useLegendStylesStore((s) => s.floatingSize);
  const backgroundColor = useLegendStylesStore((s) => s.backgroundColor);
  const noDataColor = useLegendStylesStore((s) => s.noDataColor);
  const items = useLegendDataStore((s) => s.items);

  return useMemo(() => {
    if (!savedSnapshot) return false;

    const hasData = data.allIds.length > 0;
    const dataset: ProjectDataset | null = hasData
      ? {
          allIds: data.allIds,
          byId: data.byId,
          importDataType,
          ...(importDataType === IMPORT_DATA_TYPES.sheets && google.url
            ? { google: { url: google.url, gid: google.gid } }
            : {}),
        }
      : null;

    const currentSnapshot = JSON.stringify({
      countryId: selectedCountryId,
      dataset,
      mapStyles: { border, shadow, zoomControls, picture, regionLabels },
      legendStyles: {
        labels,
        title,
        position,
        floatingPosition,
        floatingSize,
        backgroundColor,
        noDataColor,
      },
      legendData: { items: items.allIds.map((id) => items.byId[id]) },
    });

    return currentSnapshot !== savedSnapshot;
  }, [
    savedSnapshot,
    selectedCountryId,
    importDataType,
    data,
    google,
    border,
    shadow,
    zoomControls,
    picture,
    regionLabels,
    labels,
    title,
    position,
    floatingPosition,
    floatingSize,
    backgroundColor,
    noDataColor,
    items,
  ]);
}
