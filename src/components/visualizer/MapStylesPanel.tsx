import type { FC } from 'react';
import { BorderOutlined, ExpandOutlined, EyeOutlined } from '@ant-design/icons';
import { Collapse, ColorPicker, Flex, InputNumber, Slider, Switch, Typography } from 'antd';
import { useMapStylesStore } from '@/store/mapStyles/store';

const MapStylesPanel: FC = () => {
  const border = useMapStylesStore((state) => state.border);
  const shadow = useMapStylesStore((state) => state.shadow);
  const zoomControls = useMapStylesStore((state) => state.zoomControls);
  const setBorder = useMapStylesStore((state) => state.setBorder);
  const setShadow = useMapStylesStore((state) => state.setShadow);
  const setZoomControls = useMapStylesStore((state) => state.setZoomControls);

  const items = [
    {
      key: 'border',
      label: (
        <Flex align="center" gap="small">
          <BorderOutlined className="text-gray-500" />
          <Typography.Text>Border</Typography.Text>
        </Flex>
      ),
      children: (
        <Flex vertical gap="middle">
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Show Border</Typography.Text>
            <Switch checked={border.show} onChange={(checked) => setBorder({ show: checked })} />
          </Flex>
          <Flex vertical gap="small">
            <Typography.Text className="text-sm text-gray-600">Color</Typography.Text>
            <Flex align="center" gap="small">
              <ColorPicker
                value={border.color}
                onChange={(color) => setBorder({ color: color.toHexString() })}
                showText
              />
            </Flex>
          </Flex>
          <Flex vertical gap="small">
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">Width</Typography.Text>
              <Typography.Text className="text-sm text-gray-500">{border.width}px</Typography.Text>
            </Flex>
            <Slider
              min={0.5}
              max={5}
              step={0.5}
              value={border.width}
              onChange={(value) => setBorder({ width: value })}
            />
          </Flex>
        </Flex>
      ),
    },
    {
      key: 'shadow',
      label: (
        <Flex align="center" gap="small">
          <EyeOutlined className="text-gray-500" />
          <Typography.Text>Shadow</Typography.Text>
        </Flex>
      ),
      children: (
        <Flex vertical gap="middle">
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Show Shadow</Typography.Text>
            <Switch checked={shadow.show} onChange={(checked) => setShadow({ show: checked })} />
          </Flex>
          <Flex vertical gap="small">
            <Typography.Text className="text-sm text-gray-600">Color</Typography.Text>
            <ColorPicker
              value={shadow.color}
              onChange={(color) => setShadow({ color: color.toHexString() })}
              showText
            />
          </Flex>
          <Flex vertical gap="small">
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">Blur</Typography.Text>
              <Typography.Text className="text-sm text-gray-500">{shadow.blur}px</Typography.Text>
            </Flex>
            <Slider
              min={0}
              max={30}
              value={shadow.blur}
              onChange={(value) => setShadow({ blur: value })}
            />
          </Flex>
          <div className="gap-sm grid grid-cols-2">
            <Flex vertical>
              <Typography.Text className="text-sm text-gray-600">Offset X</Typography.Text>
              <InputNumber
                value={shadow.offsetX}
                onChange={(value) => setShadow({ offsetX: value ?? 0 })}
                className="w-full"
              />
            </Flex>
            <Flex vertical>
              <Typography.Text className="text-sm text-gray-600">Offset Y</Typography.Text>
              <InputNumber
                value={shadow.offsetY}
                onChange={(value) => setShadow({ offsetY: value ?? 0 })}
                className="w-full"
              />
            </Flex>
          </div>
        </Flex>
      ),
    },
    {
      key: 'zoom',
      label: (
        <Flex align="center" gap="small">
          <ExpandOutlined className="text-gray-500" />
          <Typography.Text>Zoom Controls</Typography.Text>
        </Flex>
      ),
      children: (
        <Flex vertical gap="middle">
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Show Controls</Typography.Text>
            <Switch
              checked={zoomControls.show}
              onChange={(checked) => setZoomControls({ show: checked })}
            />
          </Flex>
        </Flex>
      ),
    },
  ];

  return (
    <Flex vertical gap="middle">
      <Flex align="center" gap="small">
        <Typography.Text className="text-base text-gray-500">◇</Typography.Text>
        <Typography.Title level={3} className="text-primary text-base font-semibold">
          Map Styles
        </Typography.Title>
      </Flex>

      <Collapse items={items} defaultActiveKey={['border']} ghost expandIconPlacement="end" />
    </Flex>
  );
};

export default MapStylesPanel;
