import { type FC, useMemo } from 'react';
import { AimOutlined, EditOutlined, FontSizeOutlined } from '@ant-design/icons';
import { Collapse, ColorPicker, Flex, Input, Segmented, Slider, Switch, Typography } from 'antd';
import {
  selectLabels,
  selectNoDataColor,
  selectPosition,
  selectSetLabels,
  selectSetLegendStylesState,
  selectSetTitle,
  selectTitle,
  useLegendStylesStore,
} from '@/store/legendStyles/store';
import type { LegendPosition } from '@/types/legendStyles';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const POSITION_OPTIONS: { value: LegendPosition; label: string }[] = [
  { value: LEGEND_POSITIONS.floating, label: 'Floating' },
  { value: LEGEND_POSITIONS.bottom, label: 'Bottom' },
  { value: LEGEND_POSITIONS.hidden, label: 'Hidden' },
];

const LegendStylesPanel: FC = () => {
  const labels = useLegendStylesStore(selectLabels);
  const title = useLegendStylesStore(selectTitle);
  const position = useLegendStylesStore(selectPosition);
  const noDataColor = useLegendStylesStore(selectNoDataColor);
  const setLabels = useLegendStylesStore(selectSetLabels);
  const setTitle = useLegendStylesStore(selectSetTitle);
  const setLegendStylesState = useLegendStylesStore(selectSetLegendStylesState);

  const items = useMemo(
    () => [
      {
        key: 'title',
        label: (
          <Flex align="center" gap="small">
            <EditOutlined className="text-gray-500" />
            <Typography.Text className="font-semibold">Title</Typography.Text>
          </Flex>
        ),
        children: (
          <Flex vertical gap="small">
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">Show Title</Typography.Text>
              <Switch
                checked={title.show}
                size="small"
                onChange={(checked) => setTitle({ show: checked })}
              />
            </Flex>
            <Flex align="center" justify="space-between" gap="small">
              <Typography.Text className="shrink-0 text-sm text-gray-600">Title</Typography.Text>
              <Input
                value={title.text}
                onChange={(e) => setTitle({ text: e.target.value })}
                placeholder="Enter title"
                disabled={!title.show}
                size="small"
                className="w-3/4!"
              />
            </Flex>
          </Flex>
        ),
      },
      {
        key: 'labels',
        label: (
          <Flex align="center" gap="small">
            <FontSizeOutlined className="text-gray-500" />
            <Typography.Text className="font-semibold">Labels</Typography.Text>
          </Flex>
        ),
        children: (
          <Flex vertical gap="small">
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">Show Labels</Typography.Text>
              <Switch
                checked={labels.show}
                size="small"
                onChange={(checked) => setLabels({ show: checked })}
              />
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">Text Color</Typography.Text>
              <ColorPicker
                value={labels.color}
                onChange={(color) => setLabels({ color: color.toHexString() })}
                size="small"
                disabled={!labels.show}
              />
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">Font Size</Typography.Text>
              <Flex align="center" gap="small" className="w-1/2">
                <Slider
                  min={8}
                  max={24}
                  value={labels.fontSize}
                  onChange={(value) => setLabels({ fontSize: value })}
                  className="flex-1"
                  disabled={!labels.show}
                />
                <Typography.Text className="w-8 text-right text-sm text-gray-500">
                  {labels.fontSize}pt
                </Typography.Text>
              </Flex>
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">No Data Color</Typography.Text>
              <ColorPicker
                value={noDataColor}
                onChange={(color) => setLegendStylesState({ noDataColor: color.toHexString() })}
                size="small"
              />
            </Flex>
          </Flex>
        ),
      },
      {
        key: 'position',
        label: (
          <Flex align="center" gap="small">
            <AimOutlined className="text-gray-500" />
            <Typography.Text className="font-semibold">Position</Typography.Text>
          </Flex>
        ),
        children: (
          <Flex vertical gap="small">
            <Segmented
              value={position}
              onChange={(value) => setLegendStylesState({ position: value as LegendPosition })}
              options={POSITION_OPTIONS}
              size="small"
              block
            />
            {position === 'floating' && (
              <Typography.Text className="text-[10px]! text-gray-400">
                Drag and resize the legend on the map.
              </Typography.Text>
            )}
          </Flex>
        ),
      },
    ],
    [labels, title, position, noDataColor, setLabels, setTitle, setLegendStylesState],
  );

  return (
    <Flex vertical gap="middle">
      <SectionTitle IconComponent={AimOutlined}>Legend Styles</SectionTitle>
      <Collapse items={items} defaultActiveKey={['labels']} ghost expandIconPlacement="end" />
    </Flex>
  );
};

export default LegendStylesPanel;
