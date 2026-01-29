import type { FC } from 'react';
import { AimOutlined, FontSizeOutlined } from '@ant-design/icons';
import { Collapse, ColorPicker, Segmented, Slider, Switch } from 'antd';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import type { LegendPosition } from '@/types/legendStyles';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';

const POSITION_OPTIONS: { value: LegendPosition; label: string }[] = [
  { value: LEGEND_POSITIONS.floating, label: 'Floating' },
  { value: LEGEND_POSITIONS.bottom, label: 'Bottom' },
  { value: LEGEND_POSITIONS.hidden, label: 'Hidden' },
];

export const LegendStylesPanel: FC = () => {
  const labels = useLegendStylesStore((state) => state.labels);
  const position = useLegendStylesStore((state) => state.position);
  const setLabels = useLegendStylesStore((state) => state.setLabels);
  const setLegendStylesState = useLegendStylesStore((state) => state.setLegendStylesState);

  const items = [
    {
      key: 'labels',
      label: (
        <div className="gap-sm flex items-center">
          <FontSizeOutlined className="text-gray-500" />
          <span>Labels</span>
        </div>
      ),
      children: (
        <div className="space-y-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Show Labels</span>
            <Switch checked={labels.show} onChange={(checked) => setLabels({ show: checked })} />
          </div>
          <div className="space-y-xs">
            <span className="text-sm text-gray-600">Text Color</span>
            <ColorPicker
              value={labels.color}
              onChange={(color) => setLabels({ color: color.toHexString() })}
              showText
            />
          </div>
          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Font Size</span>
              <span className="text-sm text-gray-500">{labels.fontSize}pt</span>
            </div>
            <div className="gap-sm flex items-center">
              <Slider
                min={8}
                max={24}
                value={labels.fontSize}
                onChange={(value) => setLabels({ fontSize: value })}
                className="flex-1"
              />
              <span className="w-8 text-right text-sm">{labels.fontSize}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      label: (
        <div className="gap-sm flex items-center">
          <AimOutlined className="text-gray-500" />
          <span>Position</span>
        </div>
      ),
      children: (
        <div className="space-y-md">
          <Segmented
            value={position}
            onChange={(value) => setLegendStylesState({ position: value as LegendPosition })}
            options={POSITION_OPTIONS}
            block
          />
          {position === 'floating' && (
            <p className="text-xs text-gray-500">
              Drag and resize the legend on the map to reposition it.
            </p>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-md">
      <div className="gap-sm flex items-center">
        <span className="text-base text-gray-500">◈</span>
        <h3 className="text-primary text-base font-semibold">Legend Styles</h3>
      </div>

      <Collapse items={items} defaultActiveKey={['labels']} ghost expandIconPlacement="end" />
    </div>
  );
};
