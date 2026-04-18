import { useLegendDataStore } from '@/store/legendData/store';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useVisualizerStore } from '@/store/mapData/store';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { type FullTemporaryProjectState } from '@/helpers/temporaryProjectState';

/** Snapshot of all visualizer-related stores for guest draft / login redirect persistence. */
export function captureFullTemporaryProjectState(): FullTemporaryProjectState {
  const visualizerState = useVisualizerStore.getState();
  const mapStylesState = useMapStylesStore.getState();
  const legendStylesState = useLegendStylesStore.getState();
  const legendDataState = useLegendDataStore.getState();
  return {
    selectedCountryId: visualizerState.selectedCountryId ?? null,
    importDataType: visualizerState.importDataType,
    data: visualizerState.data,
    google: visualizerState.google,
    timelineData: visualizerState.timelineData,
    timePeriods: visualizerState.timePeriods,
    activeTimePeriod: visualizerState.activeTimePeriod,
    border: mapStylesState.border,
    shadow: mapStylesState.shadow,
    zoomControls: mapStylesState.zoomControls,
    picture: mapStylesState.picture,
    regionLabels: mapStylesState.regionLabels,
    timePeriodLabelOffset: mapStylesState.timePeriodLabelOffset,
    labels: legendStylesState.labels,
    title: legendStylesState.title,
    position: legendStylesState.position,
    floatingPosition: legendStylesState.floatingPosition,
    floatingSize: legendStylesState.floatingSize,
    floatingMapFrameSize: legendStylesState.floatingMapFrameSize,
    transparentBackground: legendStylesState.transparentBackground,
    backgroundColor: legendStylesState.backgroundColor,
    noDataColor: legendStylesState.noDataColor,
    items: legendDataState.items,
  };
}
