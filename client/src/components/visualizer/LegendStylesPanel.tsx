import { type ChangeEvent, type FC, useCallback, useMemo, useState } from 'react';
import { AimOutlined, EditOutlined, FontSizeOutlined } from '@ant-design/icons';
import {
  Collapse,
  ColorPicker,
  type ColorPickerProps,
  Flex,
  Input,
  type InputProps,
  Segmented,
  type SegmentedProps,
  Slider,
  Switch,
  type SwitchProps,
  Typography,
} from 'antd';
import {
  selectLabels,
  selectNoDataColor,
  selectPosition,
  selectSetLabels,
  selectSetLegendStylesState,
  selectSetTitle,
  selectTitle,
} from '@/store/legendStyles/selectors';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import type { LegendPosition } from '@/types/legendStyles';
import { LEGEND_POSITIONS } from '@/constants/legendStyles';
import { randomHexColor, randomInt } from '@/helpers/randomUtils';
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

  // Utility: Apply random styles
  const applyRandomStyles = useCallback(() => {
    // Font size between 8 and 24
    const fontSize = randomInt(8, 24);
    // Label color random
    const color = randomHexColor();
    // Background color random
    const backgroundColor = randomHexColor();
    // No data color random
    const noDataColor = randomHexColor();
    setLabels({ color, fontSize });
    setLegendStylesState({ backgroundColor, noDataColor });
  }, [setLabels, setLegendStylesState]);

  // Local state for debounced inputs
  const [localTitleText, setLocalTitleText] = useState(title.text);
  const [localFontSize, setLocalFontSize] = useState(labels.fontSize);

  // Debounced store updates
  const debouncedSetTitleText = useDebouncedCallback((text: string) => setTitle({ text }));
  const debouncedSetFontSize = useDebouncedCallback(
    (fontSize: number) => setLabels({ fontSize }),
    100,
  );

  // Title handlers
  const handleTitleShowChange = useCallback<NonNullable<SwitchProps['onChange']>>(
    (checked) => setTitle({ show: checked }),
    [setTitle],
  );

  const handleTitleTextChange = useCallback<NonNullable<InputProps['onChange']>>(
    (e: ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setLocalTitleText(text);
      debouncedSetTitleText(text);
    },
    [debouncedSetTitleText],
  );

  // Labels handlers
  const handleLabelsColorChange = useCallback<NonNullable<ColorPickerProps['onChangeComplete']>>(
    (color) => setLabels({ color: color.toHexString() }),
    [setLabels],
  );

  const handleLabelsFontSizeChange = useCallback(
    (value: number) => {
      setLocalFontSize(value);
      debouncedSetFontSize(value);
    },
    [debouncedSetFontSize],
  );

  const handleNoDataColorChange = useCallback<NonNullable<ColorPickerProps['onChangeComplete']>>(
    (color) => setLegendStylesState({ noDataColor: color.toHexString() }),
    [setLegendStylesState],
  );

  // Position handler
  const handlePositionChange = useCallback<NonNullable<SegmentedProps['onChange']>>(
    (value: string | number) => setLegendStylesState({ position: value as LegendPosition }),
    [setLegendStylesState],
  );

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
              <Typography.Text className="text-sm text-gray-600" id="show-title-label">
                Show Title
              </Typography.Text>
              <Switch
                checked={title.show}
                size="small"
                onChange={handleTitleShowChange}
                aria-labelledby="show-title-label"
              />
            </Flex>
            <Flex align="center" justify="space-between" gap="small">
              <Typography.Text className="shrink-0 text-sm text-gray-600">Title</Typography.Text>
              <Input
                value={localTitleText}
                onChange={handleTitleTextChange}
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
              <Typography.Text className="text-sm text-gray-600">Text Color</Typography.Text>
              <ColorPicker
                value={labels.color}
                onChangeComplete={handleLabelsColorChange}
                size="small"
              />
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600" id="legend-font-size-label">
                Font Size
              </Typography.Text>
              <Flex align="center" gap="small" className="w-1/2">
                <Slider
                  min={8}
                  max={24}
                  value={localFontSize}
                  onChange={handleLabelsFontSizeChange}
                  className="flex-1"
                  aria-labelledby="legend-font-size-label"
                />
                <Typography.Text className="w-8 text-right text-sm text-gray-500">
                  {localFontSize}pt
                </Typography.Text>
              </Flex>
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography.Text className="text-sm text-gray-600">No Data Color</Typography.Text>
              <ColorPicker
                value={noDataColor}
                onChangeComplete={handleNoDataColorChange}
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
              onChange={handlePositionChange}
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
    [
      labels.color,
      localFontSize,
      title.show,
      localTitleText,
      position,
      noDataColor,
      handleTitleShowChange,
      handleTitleTextChange,
      handleLabelsColorChange,
      handleLabelsFontSizeChange,
      handleNoDataColorChange,
      handlePositionChange,
    ],
  );

  return (
    <Flex vertical gap="middle">
      <SectionTitle IconComponent={AimOutlined}>Legend Styles</SectionTitle>
      <button
        type="button"
        onClick={applyRandomStyles}
        style={{ marginBottom: 8, alignSelf: 'flex-end' }}
      >
        Apply Random Styles
      </button>
      <Collapse items={items} defaultActiveKey={[]} ghost expandIconPlacement="end" />
    </Flex>
  );
};

export default LegendStylesPanel;
