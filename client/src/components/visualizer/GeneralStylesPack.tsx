import { type FC, useCallback } from 'react';
import { EditOutlined, UndoOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';

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
};

const DEFAULT_LEGEND_STYLES = {
  labels: {
    show: true,
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
};

// Random style packs
const RANDOM_STYLE_PACKS = [
  {
    map: {
      border: { show: true, color: '#2563EB', width: 2 },
      shadow: { show: true, color: '#1E40AF', blur: 15, offsetX: 2, offsetY: 6 },
    },
    legend: {
      labels: { show: true, color: '#1E3A8A', fontSize: 14 },
      backgroundColor: 'rgba(239, 246, 255, 0.95)',
    },
  },
  {
    map: {
      border: { show: true, color: '#059669', width: 1 },
      shadow: { show: false, color: '#000000', blur: 10, offsetX: 0, offsetY: 4 },
    },
    legend: {
      labels: { show: true, color: '#065F46', fontSize: 11 },
      backgroundColor: 'rgba(236, 253, 245, 0.95)',
    },
  },
  {
    map: {
      border: { show: true, color: '#DC2626', width: 2.5 },
      shadow: { show: true, color: '#7F1D1D', blur: 20, offsetX: 0, offsetY: 8 },
    },
    legend: {
      labels: { show: true, color: '#991B1B', fontSize: 13 },
      backgroundColor: 'rgba(254, 242, 242, 0.95)',
    },
  },
  {
    map: {
      border: { show: true, color: '#7C3AED', width: 1.5 },
      shadow: { show: true, color: '#5B21B6', blur: 12, offsetX: 3, offsetY: 3 },
    },
    legend: {
      labels: { show: true, color: '#6D28D9', fontSize: 12 },
      backgroundColor: 'rgba(245, 243, 255, 0.95)',
    },
  },
  {
    map: {
      border: { show: false, color: '#FFFFFF', width: 1 },
      shadow: { show: true, color: '#374151', blur: 25, offsetX: 0, offsetY: 10 },
    },
    legend: {
      labels: { show: true, color: '#374151', fontSize: 10 },
      backgroundColor: 'rgba(249, 250, 251, 0.98)',
    },
  },
];

const GeneralStylesPack: FC = () => {
  const setMapStylesState = useMapStylesStore((state) => state.setMapStylesState);
  const setLegendStylesState = useLegendStylesStore((state) => state.setLegendStylesState);

  const handleResetStyles = useCallback(() => {
    setMapStylesState(DEFAULT_MAP_STYLES);
    setLegendStylesState(DEFAULT_LEGEND_STYLES);
  }, [setMapStylesState, setLegendStylesState]);

  const handleApplyRandomStyles = useCallback(() => {
    const randomPack = RANDOM_STYLE_PACKS[Math.floor(Math.random() * RANDOM_STYLE_PACKS.length)];
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
