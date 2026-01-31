import { type FC, useCallback } from 'react';
import { BgColorsOutlined, EditOutlined, UndoOutlined } from '@ant-design/icons';
import { Button, Collapse, ColorPicker, Flex, InputNumber, Slider, Switch, Typography } from 'antd';
import {
  selectBorder,
  selectSetBorder,
  selectSetShadow,
  selectSetZoomControls,
  selectShadow,
  selectZoomControls,
  useMapStylesStore,
} from '@/store/mapStyles/store';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const DEFAULT_BORDER = {
  show: true,
  color: '#18294D',
  width: 1,
};

const DEFAULT_SHADOW = {
  show: false,
  color: 'rgba(0, 0, 0, 0.3)',
  blur: 10,
  offsetX: 0,
  offsetY: 4,
};

const DEFAULT_ZOOM_CONTROLS = {
  show: true,
};

// Random color palettes for Apply Random Styles
const RANDOM_BORDER_COLORS = ['#18294D', '#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1'];
const RANDOM_SHADOW_COLORS = [
  'rgba(0, 0, 0, 0.3)',
  'rgba(24, 144, 255, 0.3)',
  'rgba(82, 196, 26, 0.3)',
  'rgba(250, 140, 22, 0.3)',
];

const MapStylesPanel: FC = () => {
  const border = useMapStylesStore(selectBorder);
  const shadow = useMapStylesStore(selectShadow);
  const zoomControls = useMapStylesStore(selectZoomControls);
  const setBorder = useMapStylesStore(selectSetBorder);
  const setShadow = useMapStylesStore(selectSetShadow);
  const setZoomControls = useMapStylesStore(selectSetZoomControls);

  const handleResetStyles = useCallback(() => {
    setBorder(DEFAULT_BORDER);
    setShadow(DEFAULT_SHADOW);
    setZoomControls(DEFAULT_ZOOM_CONTROLS);
  }, [setBorder, setShadow, setZoomControls]);

  const handleApplyRandomStyles = useCallback(() => {
    const randomBorderColor =
      RANDOM_BORDER_COLORS[Math.floor(Math.random() * RANDOM_BORDER_COLORS.length)];
    const randomShadowColor =
      RANDOM_SHADOW_COLORS[Math.floor(Math.random() * RANDOM_SHADOW_COLORS.length)];
    const randomBorderWidth = Math.floor(Math.random() * 4) + 1;
    const randomShadowBlur = Math.floor(Math.random() * 20) + 5;

    setBorder({
      show: true,
      color: randomBorderColor,
      width: randomBorderWidth,
    });
    setShadow({
      show: Math.random() > 0.5,
      color: randomShadowColor,
      blur: randomShadowBlur,
      offsetX: Math.floor(Math.random() * 6) - 3,
      offsetY: Math.floor(Math.random() * 6),
    });
  }, [setBorder, setShadow]);

  const items = [
    {
      key: 'border',
      label: (
        <Flex align="center" gap="small">
          <Typography.Text className="font-semibold">Border</Typography.Text>
        </Flex>
      ),
      children: (
        <Flex vertical gap="small">
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Show Border</Typography.Text>
            <Switch
              checked={border.show}
              size="small"
              onChange={(checked) => setBorder({ show: checked })}
            />
          </Flex>
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Color</Typography.Text>
            <ColorPicker
              value={border.color}
              onChange={(color) => setBorder({ color: color.toHexString() })}
              size="small"
              disabled={!border.show}
            />
          </Flex>
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Width</Typography.Text>
            <Flex align="center" gap="small" className="w-1/2">
              <Slider
                min={1}
                max={5}
                step={1}
                value={border.width}
                onChange={(value) => setBorder({ width: value })}
                className="flex-1"
                disabled={!border.show}
              />
              <Typography.Text className="w-8 text-right text-sm text-gray-500">
                {border.width}px
              </Typography.Text>
            </Flex>
          </Flex>
        </Flex>
      ),
    },
    {
      key: 'shadow',
      label: (
        <Flex align="center" gap="small">
          <Typography.Text className="font-semibold">Shadow</Typography.Text>
        </Flex>
      ),
      children: (
        <Flex vertical gap="small">
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Show Shadow</Typography.Text>
            <Switch
              checked={shadow.show}
              size="small"
              onChange={(checked) => setShadow({ show: checked })}
            />
          </Flex>
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Color</Typography.Text>
            <ColorPicker
              value={shadow.color}
              onChange={(color) => setShadow({ color: color.toHexString() })}
              size="small"
              disabled={!shadow.show}
            />
          </Flex>
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Blur</Typography.Text>
            <Flex align="center" gap="small" className="w-1/2">
              <Slider
                min={0}
                max={30}
                value={shadow.blur}
                onChange={(value) => setShadow({ blur: value })}
                className="flex-1"
                disabled={!shadow.show}
              />
              <Typography.Text className="w-8 text-right text-sm text-gray-500">
                {shadow.blur}px
              </Typography.Text>
            </Flex>
          </Flex>
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Offset X</Typography.Text>
            <InputNumber
              value={shadow.offsetX}
              onChange={(value) => setShadow({ offsetX: value ?? 0 })}
              size="small"
              className="w-20"
              disabled={!shadow.show}
            />
          </Flex>
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Offset Y</Typography.Text>
            <InputNumber
              value={shadow.offsetY}
              onChange={(value) => setShadow({ offsetY: value ?? 0 })}
              size="small"
              className="w-20"
              disabled={!shadow.show}
            />
          </Flex>
        </Flex>
      ),
    },
    {
      key: 'zoom',
      label: (
        <Flex align="center" gap="small">
          <Typography.Text className="font-semibold">Zoom Controls</Typography.Text>
        </Flex>
      ),
      children: (
        <Flex vertical gap="small">
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Show Controls</Typography.Text>
            <Switch
              checked={zoomControls.show}
              size="small"
              onChange={(checked) => setZoomControls({ show: checked })}
            />
          </Flex>
        </Flex>
      ),
    },
  ];

  return (
    <Flex vertical gap="middle">
      <SectionTitle IconComponent={BgColorsOutlined}>Map Styles</SectionTitle>
      <Collapse items={items} defaultActiveKey={['border']} ghost expandIconPlacement="end" />
    </Flex>
  );
};

export default MapStylesPanel;
