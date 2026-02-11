import { type FC, useCallback } from 'react';
import { EditOutlined, UndoOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';
import { randomFloat, randomHexColor, randomInt } from '@/helpers/randomUtils';

// Default styles for reset
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
  picture: {
    transparentBackground: true,
    backgroundColor: '#F5F5F5',
  },
  regionLabels: {
    show: true,
    color: '#333333',
    fontSize: 10,
  },
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
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  noDataColor: '#E5E7EB',
};

// Random style packs
const generateRandomStylePack = () => {
  const showBorder = Math.random() > 0.3;
  const showShadow = Math.random() > 0.4;
  const transparentBg = Math.random() > 0.6;

  const borderColor = randomHexColor();
  const bgColor = randomHexColor();
  const labelColor = randomHexColor();
  const shadowColor = randomHexColor();
  const legendLabelColor = randomHexColor();
  const noDataColor = randomHexColor();

  // Derive a semi-transparent legend background from bgColor
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);
  const legendBg = `rgba(${r}, ${g}, ${b}, ${randomFloat(0.85, 0.98).toFixed(2)})`;

  return {
    map: {
      border: {
        show: showBorder,
        color: borderColor,
        width: randomFloat(0.5, 4),
      },
      shadow: {
        show: showShadow,
        color: shadowColor,
        blur: randomInt(5, 30),
        offsetX: randomInt(-5, 5),
        offsetY: randomInt(0, 10),
      },
      picture: {
        transparentBackground: transparentBg,
        backgroundColor: bgColor,
      },
      regionLabels: {
        show: Math.random() > 0.3,
        color: labelColor,
        fontSize: randomInt(7, 14),
      },
    },
    legend: {
      labels: {
        color: legendLabelColor,
        fontSize: randomInt(10, 16),
      },
      backgroundColor: legendBg,
      noDataColor,
    },
  };
};

const GeneralStylesPack: FC = () => {
  const setMapStylesState = useMapStylesStore((state) => state.setMapStylesState);
  const setLegendStylesState = useLegendStylesStore((state) => state.setLegendStylesState);

  const handleResetStyles = useCallback(() => {
    setMapStylesState(DEFAULT_MAP_STYLES);
    setLegendStylesState(DEFAULT_LEGEND_STYLES);
  }, [setMapStylesState, setLegendStylesState]);

  const handleApplyRandomStyles = useCallback(() => {
    const randomPack = generateRandomStylePack();
    setMapStylesState(randomPack.map);
    setLegendStylesState(randomPack.legend);
  }, [setMapStylesState, setLegendStylesState]);

  return (
    <Flex wrap gap="small">
      <Button icon={<UndoOutlined />} onClick={handleResetStyles} className="min-w-40 grow">
        Reset Styles
      </Button>
      <Button icon={<EditOutlined />} onClick={handleApplyRandomStyles} className="min-w-40 grow">
        Apply Random Styles Pack
      </Button>
    </Flex>
  );
};

export default GeneralStylesPack;
