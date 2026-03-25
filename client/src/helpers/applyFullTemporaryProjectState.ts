import { createDefaultLegendItems, useLegendDataStore } from '@/store/legendData/store';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useVisualizerStore } from '@/store/mapData/store';
import { useMapStylesStore } from '@/store/mapStyles/store';
import {
  type FullTemporaryProjectState,
  mergeTemporaryStateWithDefaults,
} from '@/helpers/temporaryProjectState';

/**
 * Applies merged temporary project state to all visualizer-related stores.
 * Used after login restore and when starting a blank project from `/projects/new`.
 */
export function applyFullTemporaryProjectState(merged: FullTemporaryProjectState): void {
  const { setVisualizerState } = useVisualizerStore.getState();
  const { setMapStylesState } = useMapStylesStore.getState();
  const { setLegendStylesState } = useLegendStylesStore.getState();
  const { setItems } = useLegendDataStore.getState();

  setVisualizerState({
    selectedCountryId: merged.selectedCountryId,
    importDataType: merged.importDataType,
    data: merged.data,
    google: merged.google,
    timelineData: merged.timelineData,
    timePeriods: merged.timePeriods,
    activeTimePeriod: merged.activeTimePeriod,
  });
  setMapStylesState({
    border: merged.border,
    shadow: merged.shadow,
    zoomControls: merged.zoomControls,
    picture: merged.picture,
    regionLabels: merged.regionLabels,
  });
  setLegendStylesState({
    labels: merged.labels,
    title: merged.title,
    position: merged.position,
    floatingPosition: merged.floatingPosition,
    floatingSize: merged.floatingSize,
    backgroundColor: merged.backgroundColor,
    noDataColor: merged.noDataColor,
  });
  setItems(merged.items.allIds.map((id) => merged.items.byId[id]));
}

/** Resets map/legend/visualizer stores to the same defaults as a fresh merged temp state. */
export function resetVisualizerToDefaultState(): void {
  applyFullTemporaryProjectState(mergeTemporaryStateWithDefaults(null));
  // Temp-state defaults use empty legend items; align with the legend store's default ranges.
  useLegendDataStore.getState().setItems(createDefaultLegendItems());
}
