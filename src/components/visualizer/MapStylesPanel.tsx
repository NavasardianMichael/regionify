import type { FC } from 'react';
import { BorderOutlined, ExpandOutlined, EyeOutlined } from '@ant-design/icons';
import { Collapse, ColorPicker, InputNumber, Slider, Switch } from 'antd';
import { useMapStylesStore } from '@/store/useMapStylesStore';

export const MapStylesPanel: FC = () => {
  const mapStyles = useMapStylesStore((state) => state.mapStyles);
  const updateBorderStyles = useMapStylesStore((state) => state.updateBorderStyles);
  const updateShadowStyles = useMapStylesStore((state) => state.updateShadowStyles);
  const updateZoomControlStyles = useMapStylesStore((state) => state.updateZoomControlStyles);

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
            <Switch
              checked={mapStyles.border.show}
              onChange={(checked) => updateBorderStyles({ show: checked })}
            />
          </div>
          <div className="space-y-xs">
            <span className="text-sm text-gray-600">Color</span>
            <div className="gap-sm flex items-center">
              <ColorPicker
                value={mapStyles.border.color}
                onChange={(color) => updateBorderStyles({ color: color.toHexString() })}
                showText
              />
            </div>
          </div>
          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Width</span>
              <span className="text-sm text-gray-500">{mapStyles.border.width}px</span>
            </div>
            <Slider
              min={0.5}
              max={5}
              step={0.5}
              value={mapStyles.border.width}
              onChange={(value) => updateBorderStyles({ width: value })}
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
            <Switch
              checked={mapStyles.shadow.show}
              onChange={(checked) => updateShadowStyles({ show: checked })}
            />
          </div>
          <div className="space-y-xs">
            <span className="text-sm text-gray-600">Color</span>
            <ColorPicker
              value={mapStyles.shadow.color}
              onChange={(color) => updateShadowStyles({ color: color.toHexString() })}
              showText
            />
          </div>
          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Blur</span>
              <span className="text-sm text-gray-500">{mapStyles.shadow.blur}px</span>
            </div>
            <Slider
              min={0}
              max={30}
              value={mapStyles.shadow.blur}
              onChange={(value) => updateShadowStyles({ blur: value })}
            />
          </div>
          <div className="gap-sm grid grid-cols-2">
            <div>
              <span className="text-sm text-gray-600">Offset X</span>
              <InputNumber
                value={mapStyles.shadow.offsetX}
                onChange={(value) => updateShadowStyles({ offsetX: value ?? 0 })}
                className="w-full"
              />
            </div>
            <div>
              <span className="text-sm text-gray-600">Offset Y</span>
              <InputNumber
                value={mapStyles.shadow.offsetY}
                onChange={(value) => updateShadowStyles({ offsetY: value ?? 0 })}
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
              checked={mapStyles.zoomControls.show}
              onChange={(checked) => updateZoomControlStyles({ show: checked })}
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
