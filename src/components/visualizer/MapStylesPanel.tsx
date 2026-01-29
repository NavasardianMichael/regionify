import type { FC } from 'react';
import { BorderOutlined, ExpandOutlined, EyeOutlined } from '@ant-design/icons';
import { Collapse, ColorPicker, InputNumber, Slider, Switch } from 'antd';
import { useMapStylesStore } from '@/store/mapStyles/store';

export const MapStylesPanel: FC = () => {
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
        <div className="gap-sm flex items-center">
          <BorderOutlined className="text-gray-500" />
          <span>Border</span>
        </div>
      ),
      children: (
        <div className="space-y-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Show Border</span>
            <Switch checked={border.show} onChange={(checked) => setBorder({ show: checked })} />
          </div>
          <div className="space-y-xs">
            <span className="text-sm text-gray-600">Color</span>
            <div className="gap-sm flex items-center">
              <ColorPicker
                value={border.color}
                onChange={(color) => setBorder({ color: color.toHexString() })}
                showText
              />
            </div>
          </div>
          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Width</span>
              <span className="text-sm text-gray-500">{border.width}px</span>
            </div>
            <Slider
              min={0.5}
              max={5}
              step={0.5}
              value={border.width}
              onChange={(value) => setBorder({ width: value })}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'shadow',
      label: (
        <div className="gap-sm flex items-center">
          <EyeOutlined className="text-gray-500" />
          <span>Shadow</span>
        </div>
      ),
      children: (
        <div className="space-y-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Show Shadow</span>
            <Switch checked={shadow.show} onChange={(checked) => setShadow({ show: checked })} />
          </div>
          <div className="space-y-xs">
            <span className="text-sm text-gray-600">Color</span>
            <ColorPicker
              value={shadow.color}
              onChange={(color) => setShadow({ color: color.toHexString() })}
              showText
            />
          </div>
          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Blur</span>
              <span className="text-sm text-gray-500">{shadow.blur}px</span>
            </div>
            <Slider
              min={0}
              max={30}
              value={shadow.blur}
              onChange={(value) => setShadow({ blur: value })}
            />
          </div>
          <div className="gap-sm grid grid-cols-2">
            <div>
              <span className="text-sm text-gray-600">Offset X</span>
              <InputNumber
                value={shadow.offsetX}
                onChange={(value) => setShadow({ offsetX: value ?? 0 })}
                className="w-full"
              />
            </div>
            <div>
              <span className="text-sm text-gray-600">Offset Y</span>
              <InputNumber
                value={shadow.offsetY}
                onChange={(value) => setShadow({ offsetY: value ?? 0 })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'zoom',
      label: (
        <div className="gap-sm flex items-center">
          <ExpandOutlined className="text-gray-500" />
          <span>Zoom Controls</span>
        </div>
      ),
      children: (
        <div className="space-y-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Show Controls</span>
            <Switch
              checked={zoomControls.show}
              onChange={(checked) => setZoomControls({ show: checked })}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-md">
      <div className="gap-sm flex items-center">
        <span className="text-base text-gray-500">◇</span>
        <h3 className="text-primary text-base font-semibold">Map Styles</h3>
      </div>

      <Collapse items={items} defaultActiveKey={['border']} ghost expandIconPosition="end" />
    </div>
  );
};
