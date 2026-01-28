import type { FC } from 'react';
import { AimOutlined, FontSizeOutlined } from '@ant-design/icons';
import { Collapse, ColorPicker, Segmented, Slider, Switch } from 'antd';
import { useLegendStylesStore } from '@/store/useLegendStylesStore';
import type { LegendStylesConfig } from '@/types/visualizer';

const POSITION_OPTIONS: { value: LegendStylesConfig['position']; label: string }[] = [
  { value: 'floating', label: 'Floating' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'hidden', label: 'Hidden' },
];

export const LegendStylesPanel: FC = () => {
  const legendStyles = useLegendStylesStore((state) => state.legendStyles);
  const updateLabelStyles = useLegendStylesStore((state) => state.updateLabelStyles);
  const updateLegendStyles = useLegendStylesStore((state) => state.updateLegendStyles);

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
            <Switch
              checked={legendStyles.labels.show}
              onChange={(checked) => updateLabelStyles({ show: checked })}
            />
          </div>
          <div className="space-y-xs">
            <span className="text-sm text-gray-600">Text Color</span>
            <ColorPicker
              value={legendStyles.labels.color}
              onChange={(color) => updateLabelStyles({ color: color.toHexString() })}
              showText
            />
          </div>
          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Font Size</span>
              <span className="text-sm text-gray-500">{legendStyles.labels.fontSize}pt</span>
            </div>
            <div className="gap-sm flex items-center">
              <Slider
                min={8}
                max={24}
                value={legendStyles.labels.fontSize}
                onChange={(value) => updateLabelStyles({ fontSize: value })}
                className="flex-1"
              />
              <span className="w-8 text-right text-sm">{legendStyles.labels.fontSize}</span>
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
            value={legendStyles.position}
            onChange={(value) =>
              updateLegendStyles({ position: value as LegendStylesConfig['position'] })
            }
            options={POSITION_OPTIONS}
            block
          />
          {legendStyles.position === 'floating' && (
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
