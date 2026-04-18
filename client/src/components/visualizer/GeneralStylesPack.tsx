import { type FC, useCallback, useState } from 'react';
import { EditOutlined, UndoOutlined } from '@ant-design/icons';
import { Button, Flex, message } from 'antd';
import { useLegendDataStore } from '@/store/legendData/store';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';
import { DEFAULT_MAP_PICTURE } from '@/constants/mapStyles';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { samplePaletteColor } from '@/helpers/samplePaletteColor';

const DEFAULT_MAP_STYLES = {
  border: {
    show: true,
    color: '#FFFFFF',
    width: 1,
  },
  shadow: {
    show: false,
    color: '#000000',
    blur: 10,
    offsetX: 0,
    offsetY: 4,
  },
  zoomControls: {
    show: true,
    position: { x: 20, y: 20 },
  },
  picture: { ...DEFAULT_MAP_PICTURE },
  regionLabels: {
    show: false,
    color: '#333333',
    fontSize: 10,
    labelPositionsByRegionId: {},
  },
  timePeriodLabelOffset: { x: 0, y: 0 },
};

const DEFAULT_LEGEND_STYLES = {
  labels: {
    color: '#18294D',
    fontSize: 12,
  },
  title: {
    show: true,
    text: 'INTENSITY RATIO',
  },
  position: LEGEND_POSITIONS.floating,
  floatingPosition: { x: 20, y: 20 },
  floatingSize: { width: 160, height: 'auto' as const },
  floatingMapFrameSize: null,
  transparentBackground: false,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  noDataColor: '#E5E7EB',
};

const GeneralStylesPack: FC = () => {
  const { t } = useTypedTranslation();
  const [randomPaletteLoading, setRandomPaletteLoading] = useState(false);
  const setMapStylesState = useMapStylesStore((state) => state.setMapStylesState);
  const setLegendStylesState = useLegendStylesStore((state) => state.setLegendStylesState);

  const handleResetStyles = useCallback(() => {
    setMapStylesState(DEFAULT_MAP_STYLES);
    setLegendStylesState({
      ...DEFAULT_LEGEND_STYLES,
      title: {
        ...DEFAULT_LEGEND_STYLES.title,
        text: t('visualizer.defaultLegendTitle'),
      },
    });
  }, [setMapStylesState, setLegendStylesState, t]);

  const handleApplyRandomPalette = useCallback(async () => {
    setRandomPaletteLoading(true);
    try {
      const { pickRandomVisualizerPalette } = await import('@/data/visualizerRandomPalettes');
      const palette = pickRandomVisualizerPalette();
      const { regionLabels, picture: currentPicture } = useMapStylesStore.getState();
      setMapStylesState({
        border: palette.map.border,
        shadow: palette.map.shadow,
        picture: { ...palette.map.picture, showWatermark: currentPicture.showWatermark },
        regionLabels: {
          ...palette.map.regionLabels,
          labelPositionsByRegionId: regionLabels.labelPositionsByRegionId,
        },
      });
      setLegendStylesState({ ...palette.legend, transparentBackground: false });

      const { items, setItems } = useLegendDataStore.getState();
      const legendItems = items.allIds.map((id) => items.byId[id]);
      if (legendItems.length > 0) {
        const coloredItems = legendItems.map((item, index) => ({
          ...item,
          color: samplePaletteColor(palette.rangeColors, index, legendItems.length),
        }));
        setItems(coloredItems);
      }
    } catch {
      message.error(t('visualizer.randomPaletteLoadFailed'));
    } finally {
      setRandomPaletteLoading(false);
    }
  }, [setLegendStylesState, setMapStylesState, t]);

  return (
    <Flex wrap gap="small">
      <Button
        icon={<UndoOutlined />}
        onClick={handleResetStyles}
        className="min-w-40 grow"
        data-i18n-key="visualizer.resetStyles"
      >
        {t('visualizer.resetStyles')}
      </Button>
      <Button
        icon={<EditOutlined />}
        loading={randomPaletteLoading}
        disabled={randomPaletteLoading}
        onClick={() => void handleApplyRandomPalette()}
        className="min-w-40 grow"
        data-i18n-key="visualizer.randomStylesPack"
      >
        {t('visualizer.randomStylesPack')}
      </Button>
    </Flex>
  );
};

export default GeneralStylesPack;
