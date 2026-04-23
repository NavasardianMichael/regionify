import { type ChangeEvent, type FC, useCallback, useMemo, useState } from 'react';
import { AimOutlined, BgColorsOutlined, EditOutlined, FontSizeOutlined } from '@ant-design/icons';
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
  selectBackgroundColor,
  selectLabels,
  selectPosition,
  selectSetLabels,
  selectSetLegendStylesState,
  selectSetTitle,
  selectTitle,
  selectTransparentBackground,
} from '@/store/legendStyles/selectors';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import type { LegendPosition } from '@/types/legendStyles';
import { LEGEND_POSITIONS, resolveOpaqueLegendBackgroundColor } from '@/constants/legendStyles';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const LegendStylesPanel: FC = () => {
  const { t } = useTypedTranslation();
  const labels = useLegendStylesStore(selectLabels);
  const title = useLegendStylesStore(selectTitle);
  const position = useLegendStylesStore(selectPosition);
  const transparentBackground = useLegendStylesStore(selectTransparentBackground);
  const legendBackgroundColor = useLegendStylesStore(selectBackgroundColor);
  const setLabels = useLegendStylesStore(selectSetLabels);
  const setLegendStylesState = useLegendStylesStore(selectSetLegendStylesState);
  const setTitle = useLegendStylesStore(selectSetTitle);

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

  // Position handler
  const handlePositionChange = useCallback<NonNullable<SegmentedProps['onChange']>>(
    (value: string | number) => setLegendStylesState({ position: value as LegendPosition }),
    [setLegendStylesState],
  );

  const handleLegendTransparentChange = useCallback<NonNullable<SwitchProps['onChange']>>(
    (checked) => setLegendStylesState({ transparentBackground: checked }),
    [setLegendStylesState],
  );

  const handleLegendBackgroundColorChange = useCallback<
    NonNullable<ColorPickerProps['onChangeComplete']>
  >(
    (color) => setLegendStylesState({ backgroundColor: color.toHexString() }),
    [setLegendStylesState],
  );

  const positionOptions = useMemo(
    () => [
      { value: LEGEND_POSITIONS.floating, label: t('visualizer.legendStyles.positionFloating') },
      { value: LEGEND_POSITIONS.bottom, label: t('visualizer.legendStyles.positionBottom') },
      { value: LEGEND_POSITIONS.hidden, label: t('visualizer.legendStyles.positionHidden') },
    ],
    [t],
  );

  const items = useMemo(
    () => [
      {
        key: 'background',
        label: (
          <Flex align="center" gap="small">
            <BgColorsOutlined className="text-gray-500" />
            <Typography.Text
              className="font-semibold"
              data-i18n-key="visualizer.mapStyles.collapseBackground"
            >
              {t('visualizer.mapStyles.collapseBackground')}
            </Typography.Text>
          </Flex>
        ),
        children: (
          <Flex vertical gap="small">
            <Flex align="center" justify="space-between">
              <Typography.Text
                className="text-sm text-gray-600"
                id="legend-transparent-bg-label"
                data-i18n-key="visualizer.mapStyles.transparent"
              >
                {t('visualizer.mapStyles.transparent')}
              </Typography.Text>
              <Switch
                checked={transparentBackground}
                size="small"
                onChange={handleLegendTransparentChange}
                aria-labelledby="legend-transparent-bg-label"
              />
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography.Text
                className="text-sm text-gray-600"
                data-i18n-key="visualizer.mapStyles.color"
              >
                {t('visualizer.mapStyles.color')}
              </Typography.Text>
              <ColorPicker
                value={resolveOpaqueLegendBackgroundColor({
                  backgroundColor: legendBackgroundColor,
                })}
                onChangeComplete={handleLegendBackgroundColorChange}
                size="small"
                disabled={transparentBackground}
              />
            </Flex>
          </Flex>
        ),
      },
      {
        key: 'title',
        label: (
          <Flex align="center" gap="small">
            <EditOutlined className="text-gray-500" />
            <Typography.Text
              className="font-semibold"
              data-i18n-key="visualizer.legendStyles.collapseTitle"
            >
              {t('visualizer.legendStyles.collapseTitle')}
            </Typography.Text>
          </Flex>
        ),
        children: (
          <Flex vertical gap="small">
            <Flex align="center" justify="space-between">
              <Typography.Text
                className="text-sm text-gray-600"
                id="show-title-label"
                data-i18n-key="visualizer.legendStyles.showTitle"
              >
                {t('visualizer.legendStyles.showTitle')}
              </Typography.Text>
              <Switch
                checked={title.show}
                size="small"
                onChange={handleTitleShowChange}
                aria-labelledby="show-title-label"
              />
            </Flex>
            <Flex align="center" justify="space-between" gap="small">
              <Typography.Text
                className="shrink-0 text-sm text-gray-600"
                data-i18n-key="visualizer.legendStyles.titleField"
              >
                {t('visualizer.legendStyles.titleField')}
              </Typography.Text>
              <Input
                value={localTitleText}
                onChange={handleTitleTextChange}
                placeholder={t('visualizer.legendStyles.titlePlaceholder')}
                disabled={!title.show}
                size="small"
                className="w-3/4!"
                data-i18n-key="visualizer.legendStyles.titlePlaceholder"
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
            <Typography.Text
              className="font-semibold"
              data-i18n-key="visualizer.legendStyles.collapseLabels"
            >
              {t('visualizer.legendStyles.collapseLabels')}
            </Typography.Text>
          </Flex>
        ),
        children: (
          <Flex vertical gap="small">
            <Flex align="center" justify="space-between">
              <Typography.Text
                className="text-sm text-gray-600"
                data-i18n-key="visualizer.legendStyles.textColor"
              >
                {t('visualizer.legendStyles.textColor')}
              </Typography.Text>
              <ColorPicker
                value={labels.color}
                onChangeComplete={handleLabelsColorChange}
                size="small"
              />
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography.Text
                className="text-sm text-gray-600"
                id="legend-font-size-label"
                data-i18n-key="visualizer.legendStyles.fontSize"
              >
                {t('visualizer.legendStyles.fontSize')}
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
          </Flex>
        ),
      },
      {
        key: 'position',
        label: (
          <Flex align="center" gap="small">
            <AimOutlined className="text-gray-500" />
            <Typography.Text
              className="font-semibold"
              data-i18n-key="visualizer.legendStyles.collapsePosition"
            >
              {t('visualizer.legendStyles.collapsePosition')}
            </Typography.Text>
          </Flex>
        ),
        children: (
          <Flex vertical gap="small">
            <Segmented
              value={position}
              onChange={handlePositionChange}
              options={positionOptions}
              size="small"
              block
            />
            {position === 'floating' && (
              <Typography.Text
                className="text-[10px]! text-gray-400"
                data-i18n-key="visualizer.legendStyles.floatingHint"
              >
                {t('visualizer.legendStyles.floatingHint')}
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
      transparentBackground,
      legendBackgroundColor,
      positionOptions,
      handleTitleShowChange,
      handleTitleTextChange,
      handleLabelsColorChange,
      handleLabelsFontSizeChange,
      handleLegendTransparentChange,
      handleLegendBackgroundColorChange,
      handlePositionChange,
      t,
    ],
  );

  return (
    <Flex vertical gap="middle">
      <SectionTitle
        IconComponent={AimOutlined}
        data-i18n-key="visualizer.legendStyles.sectionTitle"
      >
        {t('visualizer.legendStyles.sectionTitle')}
      </SectionTitle>
      <Collapse items={items} defaultActiveKey={[]} ghost expandIconPlacement="end" />
    </Flex>
  );
};

export default LegendStylesPanel;
