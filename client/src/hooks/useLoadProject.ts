import { useCallback } from 'react';

import type { Project } from '@/api/projects/types';
import { IMPORT_DATA_TYPES } from '@/constants/data';
import { captureStateSnapshot } from '@/hooks/useProjectState';
import type { ImportDataType, RegionId } from '@/types/mapData';
import { useLegendDataStore } from '@/store/legendData/store';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useVisualizerStore } from '@/store/mapData/store';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { useProjectsStore } from '@/store/projects/store';

/**
 * Returns a callback that loads a project's data into all stores.
 */
export function useLoadProject(): (project: Project) => void {
  return useCallback((project: Project) => {
    const { setVisualizerState } = useVisualizerStore.getState();
    const { setMapStylesState } = useMapStylesStore.getState();
    const { setLegendStylesState } = useLegendStylesStore.getState();
    const { setItems } = useLegendDataStore.getState();
    const { setCurrentProjectId, setSavedStateSnapshot } = useProjectsStore.getState();

    // Load region + dataset
    setVisualizerState({
      selectedRegionId: (project.selectedRegionId as RegionId) ?? null,
      importDataType: (project.dataset?.importDataType as ImportDataType) ?? IMPORT_DATA_TYPES.csv,
      data: project.dataset
        ? { allIds: project.dataset.allIds, byId: project.dataset.byId }
        : { allIds: [], byId: {} },
    });

    // Load map styles (merge with current defaults for safety)
    if (project.mapStyles) {
      setMapStylesState({
        border: project.mapStyles.border,
        shadow: project.mapStyles.shadow,
        zoomControls: project.mapStyles.zoomControls,
        picture: project.mapStyles.picture,
        regionLabels: project.mapStyles.regionLabels,
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

    // Set current project and capture baseline snapshot
    setCurrentProjectId(project.id);

    // Use requestAnimationFrame to capture snapshot after stores settle
    requestAnimationFrame(() => {
      setSavedStateSnapshot(captureStateSnapshot());
    });
  }, []);
}
