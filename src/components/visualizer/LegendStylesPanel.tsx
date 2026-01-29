import type { FC } from 'react';
import { AimOutlined, FontSizeOutlined } from '@ant-design/icons';
import { Collapse, ColorPicker, Flex, Segmented, Slider, Switch, Typography } from 'antd';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import type { LegendPosition } from '@/types/legendStyles';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';

const POSITION_OPTIONS: { value: LegendPosition; label: string }[] = [
  { value: LEGEND_POSITIONS.floating, label: 'Floating' },
  { value: LEGEND_POSITIONS.bottom, label: 'Bottom' },
  { value: LEGEND_POSITIONS.hidden, label: 'Hidden' },
];

const LegendStylesPanel: FC = () => {
  const labels = useLegendStylesStore((state) => state.labels);
  const position = useLegendStylesStore((state) => state.position);
  const setLabels = useLegendStylesStore((state) => state.setLabels);
  const setLegendStylesState = useLegendStylesStore((state) => state.setLegendStylesState);

  const items = [
    {
      key: 'labels',
      label: (
        <Flex align="center" gap="small">
          <FontSizeOutlined className="text-gray-500" />
          <Typography.Text>Labels</Typography.Text>
        </Flex>
      ),
      children: (
        <Flex vertical gap="middle">
          <Flex align="center" justify="space-between">
            <Typography.Text className="text-sm text-gray-600">Show Labels</Typography.Text>
            <Switch checked={labels.show} onChange={(checked) => setLabels({ show: checked })} />
          </Flex>
          <Flex vertical gap="small">
            <Typography.Text className="text-sm text-gray-600">Text Color</Typography.Text>
            <ColorPicker
              value={labels.color}
              onChange={(color) => setLabels({ color: color.toHexString() })}
              showText
            />
          </Flex>
          <Flex vertical gap="small">
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">Font Size</Typography.Text>
              <Typography.Text className="text-sm text-gray-500">
                {labels.fontSize}pt
              </Typography.Text>
            </Flex>
            <Flex align="center" gap="small">
              <Slider
                min={8}
                max={24}
                value={labels.fontSize}
                onChange={(value) => setLabels({ fontSize: value })}
                className="flex-1"
              />
              <Typography.Text className="w-8 text-right text-sm">
                {labels.fontSize}
              </Typography.Text>
            </Flex>
          </Flex>
        </Flex>
      ),
    },
    {
      key: 'position',
      label: (
        <Flex align="center" gap="small">
          <AimOutlined className="text-gray-500" />
          <Typography.Text>Position</Typography.Text>
        </Flex>
      ),
      children: (
        <Flex vertical gap="middle">
          <Segmented
            value={position}
            onChange={(value) => setLegendStylesState({ position: value as LegendPosition })}
            options={POSITION_OPTIONS}
            block
          />
          {position === 'floating' && (
            <Typography.Paragraph className="text-xs text-gray-500">
              Drag and resize the legend on the map to reposition it.
            </Typography.Paragraph>
          )}
        </Flex>
      ),
    },
  ];

  return (
    <Flex vertical gap="middle">
      <Flex align="center" gap="small">
        <Typography.Text className="text-base text-gray-500">◈</Typography.Text>
        <Typography.Title level={3} className="text-primary text-base font-semibold">
          Legend Styles
        </Typography.Title>
      </Flex>

      <Collapse items={items} defaultActiveKey={['labels']} ghost expandIconPlacement="end" />
    </Flex>
  );
};

export default LegendStylesPanel;
