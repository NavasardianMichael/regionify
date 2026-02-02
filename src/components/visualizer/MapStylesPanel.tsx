import { type FC, useCallback, useMemo, useState } from 'react';
import { BgColorsOutlined } from '@ant-design/icons';
import {
  Collapse,
  ColorPicker,
  type ColorPickerProps,
  Flex,
  InputNumber,
  Slider,
  Switch,
  type SwitchProps,
  Typography,
} from 'antd';
import {
  selectBorder,
  selectRegionLabels,
  selectSetBorder,
  selectSetRegionLabels,
  selectSetShadow,
  selectSetZoomControls,
  selectShadow,
  selectZoomControls,
} from '@/store/mapStyles/selectors';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const DEBOUNCE_MS = 150;

const MapStylesPanel: FC = () => {
  const border = useMapStylesStore(selectBorder);
  const shadow = useMapStylesStore(selectShadow);
  const zoomControls = useMapStylesStore(selectZoomControls);
  const regionLabels = useMapStylesStore(selectRegionLabels);
  const setBorder = useMapStylesStore(selectSetBorder);
  const setShadow = useMapStylesStore(selectSetShadow);
  const setZoomControls = useMapStylesStore(selectSetZoomControls);
  const setRegionLabels = useMapStylesStore(selectSetRegionLabels);

  // Local state for debounced number inputs
  const [localOffsetX, setLocalOffsetX] = useState(shadow.offsetX);
  const [localOffsetY, setLocalOffsetY] = useState(shadow.offsetY);

  // Debounced store updates for offset inputs
  const debouncedSetOffsetX = useDebouncedCallback(
    (value: number) => setShadow({ offsetX: value }),
    DEBOUNCE_MS,
  );
  const debouncedSetOffsetY = useDebouncedCallback(
    (value: number) => setShadow({ offsetY: value }),
    DEBOUNCE_MS,
  );

  // Border handlers
  const handleBorderShowChange = useCallback<NonNullable<SwitchProps['onChange']>>(
    (checked) => setBorder({ show: checked }),
    [setBorder],
  );

  const handleBorderColorChange = useCallback<NonNullable<ColorPickerProps['onChangeComplete']>>(
    (color) => setBorder({ color: color.toHexString() }),
    [setBorder],
  );

  const handleBorderWidthChange = useCallback(
    (value: number) => setBorder({ width: value }),
    [setBorder],
  );

  // Shadow handlers
  const handleShadowShowChange = useCallback<NonNullable<SwitchProps['onChange']>>(
    (checked) => setShadow({ show: checked }),
    [setShadow],
  );

  const handleShadowColorChange = useCallback<NonNullable<ColorPickerProps['onChangeComplete']>>(
    (color) => setShadow({ color: color.toHexString() }),
    [setShadow],
  );

  const handleShadowBlurChange = useCallback(
    (value: number) => setShadow({ blur: value }),
    [setShadow],
  );

  const handleShadowOffsetXChange = useCallback(
    (value: number | null) => {
      const val = value ?? 0;
      setLocalOffsetX(val);
      debouncedSetOffsetX(val);
    },
    [debouncedSetOffsetX],
  );

  const handleShadowOffsetYChange = useCallback(
    (value: number | null) => {
      const val = value ?? 0;
      setLocalOffsetY(val);
      debouncedSetOffsetY(val);
    },
    [debouncedSetOffsetY],
  );

  // Zoom controls handlers
  const handleZoomControlsShowChange = useCallback<NonNullable<SwitchProps['onChange']>>(
    (checked) => setZoomControls({ show: checked }),
    [setZoomControls],
  );

  // Region labels handlers
  const handleRegionLabelsShowChange = useCallback<NonNullable<SwitchProps['onChange']>>(
    (checked) => setRegionLabels({ show: checked }),
    [setRegionLabels],
  );

  const handleRegionLabelsColorChange = useCallback<
    NonNullable<ColorPickerProps['onChangeComplete']>
  >((color) => setRegionLabels({ color: color.toHexString() }), [setRegionLabels]);

  const handleRegionLabelsFontSizeChange = useCallback(
    (value: number) => setRegionLabels({ fontSize: value }),
    [setRegionLabels],
  );

  const items = useMemo(
    () => [
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
              <Typography.Text className="text-sm text-gray-600" id="show-border-label">
                Show Border
              </Typography.Text>
              <Switch
                checked={border.show}
                size="small"
                onChange={handleBorderShowChange}
                aria-labelledby="show-border-label"
              />
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">Color</Typography.Text>
              <ColorPicker
                value={border.color}
                onChangeComplete={handleBorderColorChange}
                size="small"
                disabled={!border.show}
              />
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600" id="border-width-label">
                Width
              </Typography.Text>
              <Flex align="center" gap="small" className="w-1/2">
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={border.width}
                  onChange={handleBorderWidthChange}
                  className="flex-1"
                  disabled={!border.show}
                  aria-labelledby="border-width-label"
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
              <Typography.Text className="text-sm text-gray-600" id="show-shadow-label">
                Show Shadow
              </Typography.Text>
              <Switch
                checked={shadow.show}
                size="small"
                onChange={handleShadowShowChange}
                aria-labelledby="show-shadow-label"
              />
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">Color</Typography.Text>
              <ColorPicker
                value={shadow.color}
                onChangeComplete={handleShadowColorChange}
                size="small"
                disabled={!shadow.show}
              />
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600" id="shadow-blur-label">
                Blur
              </Typography.Text>
              <Flex align="center" gap="small" className="w-1/2">
                <Slider
                  min={0}
                  max={30}
                  value={shadow.blur}
                  onChange={handleShadowBlurChange}
                  className="flex-1"
                  disabled={!shadow.show}
                  aria-labelledby="shadow-blur-label"
                />
                <Typography.Text className="w-8 text-right text-sm text-gray-500">
                  {shadow.blur}px
                </Typography.Text>
              </Flex>
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">Offset X</Typography.Text>
              <InputNumber
                value={localOffsetX}
                onChange={handleShadowOffsetXChange}
                size="small"
                className="w-20"
                disabled={!shadow.show}
              />
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">Offset Y</Typography.Text>
              <InputNumber
                value={localOffsetY}
                onChange={handleShadowOffsetYChange}
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
              <Typography.Text className="text-sm text-gray-600" id="show-controls-label">
                Show Controls
              </Typography.Text>
              <Switch
                checked={zoomControls.show}
                size="small"
                onChange={handleZoomControlsShowChange}
                aria-labelledby="show-controls-label"
              />
            </Flex>
          </Flex>
        ),
      },
      {
        key: 'labels',
        label: (
          <Flex align="center" gap="small">
            <Typography.Text className="font-semibold">Region Labels</Typography.Text>
          </Flex>
        ),
        children: (
          <Flex vertical gap="small">
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600" id="show-region-labels-label">
                Show Labels
              </Typography.Text>
              <Switch
                checked={regionLabels.show}
                size="small"
                onChange={handleRegionLabelsShowChange}
                aria-labelledby="show-region-labels-label"
              />
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">Color</Typography.Text>
              <ColorPicker
                value={regionLabels.color}
                onChangeComplete={handleRegionLabelsColorChange}
                size="small"
                disabled={!regionLabels.show}
              />
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600" id="region-labels-font-size-label">
                Font Size
              </Typography.Text>
              <Flex align="center" gap="small" className="w-1/2">
                <Slider
                  min={6}
                  max={24}
                  step={1}
                  value={regionLabels.fontSize}
                  onChange={handleRegionLabelsFontSizeChange}
                  className="flex-1"
                  disabled={!regionLabels.show}
                  aria-labelledby="region-labels-font-size-label"
                />
                <Typography.Text className="w-8 text-right text-sm text-gray-500">
                  {regionLabels.fontSize}px
                </Typography.Text>
              </Flex>
            </Flex>
          </Flex>
        ),
      },
    ],
    [
      border,
      shadow.show,
      shadow.color,
      shadow.blur,
      localOffsetX,
      localOffsetY,
      zoomControls.show,
      regionLabels,
      handleBorderShowChange,
      handleBorderColorChange,
      handleBorderWidthChange,
      handleShadowShowChange,
      handleShadowColorChange,
      handleShadowBlurChange,
      handleShadowOffsetXChange,
      handleShadowOffsetYChange,
      handleZoomControlsShowChange,
      handleRegionLabelsShowChange,
      handleRegionLabelsColorChange,
      handleRegionLabelsFontSizeChange,
    ],
  );

  return (
    <Flex vertical gap="middle">
      <SectionTitle IconComponent={BgColorsOutlined}>Map Styles</SectionTitle>
      <Collapse items={items} defaultActiveKey={['border']} ghost expandIconPlacement="end" />
    </Flex>
  );
};

export default MapStylesPanel;
