import { useCallback } from 'react';
import type { Project } from '@/api/projects/types';
import { useLegendDataStore } from '@/store/legendData/store';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useVisualizerStore } from '@/store/mapData/store';
import type { RegionData } from '@/store/mapData/types';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { useProjectsStore } from '@/store/projects/store';
import { captureStateSnapshot } from '@/hooks/useProjectState';
import type { CountryId } from '@/types/mapData';
import { IMPORT_DATA_TYPES } from '@/constants/data';
import { readGoogleFromDataset } from '@/helpers/readGoogleFromDataset';

type LegacyRegionRow = RegionData & { hiddenFromChart?: boolean };

function migrateDatasetById(byId: Record<string, RegionData>): Record<string, RegionData> {
  return Object.fromEntries(
    Object.entries(byId).map(([id, r]) => {
      const row = r as LegacyRegionRow;
      if (row.hiddenFromChart === true && row.hidden !== true) {
        const { hiddenFromChart: _, ...rest } = row;
        return [id, { ...rest, hidden: true } satisfies RegionData];
      }
      return [id, r];
    }),
  );
}

export type LoadProjectOptions = {
  /**
   * When false, skips setting current project id and saved snapshot (e.g. public embed view).
   * Default true.
   */
  associateWithProjectsStore?: boolean;
};

/**
 * Returns a callback that loads a project's data into all stores.
 */
export function useLoadProject(): (project: Project, options?: LoadProjectOptions) => void {
  return useCallback((project: Project, options?: LoadProjectOptions) => {
    const { setVisualizerState, clearTimelineData } = useVisualizerStore.getState();
    clearTimelineData();
    const { setMapStylesState } = useMapStylesStore.getState();
    const { setLegendStylesState } = useLegendStylesStore.getState();
    const { setItems } = useLegendDataStore.getState();
    const { setCurrentProjectId, setSavedStateSnapshot } = useProjectsStore.getState();

    const importDataType = project.dataset?.importDataType ?? IMPORT_DATA_TYPES.csv;
    const google = readGoogleFromDataset(project.dataset ?? null);
    const isSheetsSync = importDataType === IMPORT_DATA_TYPES.sheets && Boolean(google.url);

    // Load country + dataset (Google Sheets: rows come only from /sheets/fetch, not stored JSON)
    setVisualizerState({
      selectedCountryId: (project.countryId as CountryId) ?? null,
      importDataType,
      data: isSheetsSync
        ? { allIds: [], byId: {} }
        : project.dataset
          ? {
              allIds: project.dataset.allIds,
              byId: migrateDatasetById(project.dataset.byId),
            }
          : { allIds: [], byId: {} },
      google,
      isGoogleSheetSyncLoading: false,
    });

    // Load map styles (merge with current defaults for safety)
    if (project.mapStyles) {
      const legacyPositions =
        (project.mapStyles as { regionLabelPositions?: Record<string, { x: number; y: number }> })
          .regionLabelPositions ?? {};
      setMapStylesState({
        border: project.mapStyles.border,
        shadow: project.mapStyles.shadow,
        zoomControls: project.mapStyles.zoomControls,
        picture: project.mapStyles.picture,
        regionLabels: {
          ...project.mapStyles.regionLabels,
          labelPositionsByRegionId:
            project.mapStyles.regionLabels.labelPositionsByRegionId ?? legacyPositions,
        },
      });
    }

    // Load legend styles
    if (project.legendStyles) {
      setLegendStylesState({
        labels: project.legendStyles.labels,
        title: project.legendStyles.title,
        position: project.legendStyles.position as ReturnType<
          typeof useLegendStylesStore.getState
        >['position'],
        floatingPosition: project.legendStyles.floatingPosition,
        floatingSize: project.legendStyles.floatingSize,
        backgroundColor: project.legendStyles.backgroundColor,
        noDataColor: project.legendStyles.noDataColor,
      });
    }

    // Load legend data
    if (project.legendData?.items) {
      setItems(project.legendData.items);
    }

    if (options?.associateWithProjectsStore !== false) {
      setCurrentProjectId(project.id);
      requestAnimationFrame(() => {
        setSavedStateSnapshot(captureStateSnapshot());
      });
    }
  }, []);
}
