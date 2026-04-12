import { type FC } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { selectItemsList } from '@/store/legendData/selectors';
import { useLegendDataStore } from '@/store/legendData/store';
import {
  selectBackgroundColor,
  selectLabels,
  selectNoDataColor,
  selectPosition,
  selectTitle,
  selectTransparentBackground,
} from '@/store/legendStyles/selectors';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';
import { MapLegendContent } from '@/components/visualizer/MapViewer/MapLegendContent';

export const MapBottomLegend: FC = () => {
  const position = useLegendStylesStore(selectPosition);
  const transparentBackground = useLegendStylesStore(selectTransparentBackground);
  const backgroundColor = useLegendStylesStore(selectBackgroundColor);
  const labels = useLegendStylesStore(selectLabels);
  const title = useLegendStylesStore(selectTitle);
  const noDataColor = useLegendStylesStore(selectNoDataColor);
  const legendItems = useLegendDataStore(useShallow(selectItemsList));

  if (position !== LEGEND_POSITIONS.bottom || legendItems.length === 0) return null;

  return (
    <div
      className="p-md pt-md shrink-0 border-t border-gray-200"
      data-map-export-bottom-legend
      style={{ backgroundColor: transparentBackground ? 'transparent' : backgroundColor }}
    >
      <MapLegendContent
        title={title}
        labels={labels}
        legendItems={legendItems}
        noDataColor={noDataColor}
      />
    </div>
  );
};
