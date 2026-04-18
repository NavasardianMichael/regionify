import { useMemo } from 'react';
import type {
  ProjectCreatePayload,
  ProjectDataset,
  ProjectLegendData,
  ProjectLegendStyles,
  ProjectMapStyles,
  ProjectUpdatePayload,
} from '@/api/projects/types';
import { useLegendDataStore } from '@/store/legendData/store';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useVisualizerStore } from '@/store/mapData/store';
import type { DataSet, GoogleSheetSource } from '@/store/mapData/types';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectSavedStateSnapshot } from '@/store/projects/selectors';
import { useProjectsStore } from '@/store/projects/store';
import type { ImportDataType } from '@/types/mapData';
import { IMPORT_DATA_TYPES } from '@/constants/data';

/** Persisted dataset: linked Google Sheets only stores the URL; row data is fetched client-side. */
function buildPersistedDataset(
  importDataType: ImportDataType,
  google: GoogleSheetSource,
  data: DataSet,
): ProjectDataset | null {
  const isSheetsLinked = importDataType === IMPORT_DATA_TYPES.sheets && Boolean(google.url);
  const hasTabularData = data.allIds.length > 0;
  if (!hasTabularData && !isSheetsLinked) return null;

  return {
    allIds: isSheetsLinked ? [] : data.allIds,
    byId: isSheetsLinked ? {} : data.byId,
    importDataType,
    ...(isSheetsLinked ? { google: { url: google.url as string, gid: google.gid } } : {}),
  };
}

/** Dataset slice for dirty-check snapshots (includes live rows even when Google-linked). */
function buildSnapshotDataset(
  importDataType: ImportDataType,
  google: GoogleSheetSource,
  data: DataSet,
): ProjectDataset | null {
  const isSheetsLinked = importDataType === IMPORT_DATA_TYPES.sheets && Boolean(google.url);
  const hasTabularData = data.allIds.length > 0;
  if (!hasTabularData && !isSheetsLinked) return null;

  return {
    allIds: data.allIds,
    byId: data.byId,
    importDataType,
    ...(isSheetsLinked ? { google: { url: google.url as string, gid: google.gid } } : {}),
  };
}

/**
 * Builds a serializable snapshot of the current visualizer state
 * (all stores combined, actions excluded).
 */
function buildStateSnapshot(): string {
  const { selectedCountryId, importDataType, data, google } = useVisualizerStore.getState();
  const { border, shadow, zoomControls, picture, regionLabels, timePeriodLabelOffset } =
    useMapStylesStore.getState();
  const {
    labels,
    title,
    position,
    floatingPosition,
    floatingSize,
    transparentBackground,
    backgroundColor,
    noDataColor,
  } = useLegendStylesStore.getState();
  const { items } = useLegendDataStore.getState();

  const dataset = buildSnapshotDataset(importDataType, google, data);

  const mapStyles: ProjectMapStyles = {
    border,
    shadow,
    zoomControls,
    picture,
    regionLabels,
    timePeriodLabelOffset,
  };

  const legendStyles: ProjectLegendStyles = {
    labels,
    title,
    position,
    floatingPosition,
    floatingSize,
    transparentBackground,
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
 * Omit `name` on updates so the server does not overwrite the stored title with an empty string.
 */
export function getProjectPayload(): ProjectUpdatePayload;
export function getProjectPayload(name: string): ProjectCreatePayload;
export function getProjectPayload(name?: string): ProjectCreatePayload | ProjectUpdatePayload {
  const { selectedCountryId, importDataType, data, google } = useVisualizerStore.getState();
  const { border, shadow, zoomControls, picture, regionLabels, timePeriodLabelOffset } =
    useMapStylesStore.getState();
  const {
    labels,
    title,
    position,
    floatingPosition,
    floatingSize,
    floatingMapFrameSize,
    transparentBackground,
    backgroundColor,
    noDataColor,
  } = useLegendStylesStore.getState();
  const { items } = useLegendDataStore.getState();

  const base = {
    countryId: selectedCountryId,
    dataset: buildPersistedDataset(importDataType, google, data),
    mapStyles: {
      border,
      shadow,
      zoomControls,
      picture,
      regionLabels,
      timePeriodLabelOffset,
    },
    legendStyles: {
      labels,
      title,
      position,
      floatingPosition,
      floatingSize,
      floatingMapFrameSize: floatingMapFrameSize ?? null,
      transparentBackground,
      backgroundColor,
      noDataColor,
    },
    legendData: { items: items.allIds.map((id) => items.byId[id]) },
  };

  if (name === undefined) {
    return base;
  }

  return { ...base, name };
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
  const timePeriodLabelOffset = useMapStylesStore((s) => s.timePeriodLabelOffset);
  const labels = useLegendStylesStore((s) => s.labels);
  const title = useLegendStylesStore((s) => s.title);
  const position = useLegendStylesStore((s) => s.position);
  const floatingPosition = useLegendStylesStore((s) => s.floatingPosition);
  const floatingSize = useLegendStylesStore((s) => s.floatingSize);
  const transparentBackground = useLegendStylesStore((s) => s.transparentBackground);
  const backgroundColor = useLegendStylesStore((s) => s.backgroundColor);
  const noDataColor = useLegendStylesStore((s) => s.noDataColor);
  const items = useLegendDataStore((s) => s.items);

  return useMemo(() => {
    if (!savedSnapshot) return false;

    const dataset = buildSnapshotDataset(importDataType, google, data);

    const currentSnapshot = JSON.stringify({
      countryId: selectedCountryId,
      dataset,
      mapStyles: { border, shadow, zoomControls, picture, regionLabels, timePeriodLabelOffset },
      legendStyles: {
        labels,
        title,
        position,
        floatingPosition,
        floatingSize,
        transparentBackground,
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
    timePeriodLabelOffset,
    labels,
    title,
    position,
    floatingPosition,
    floatingSize,
    transparentBackground,
    backgroundColor,
    noDataColor,
    items,
  ]);
}
