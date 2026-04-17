import { type FC } from 'react';
import {
  ColorPicker,
  type ColorPickerProps,
  Flex,
  Slider,
  Switch,
  type SwitchProps,
  Typography,
} from 'antd';
import type { RegionLabelsConfig } from '@/store/mapStyles/types';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type RegionLabelsSectionProps = {
  regionLabels: RegionLabelsConfig;
  onShowChange: NonNullable<SwitchProps['onChange']>;
  onColorChange: NonNullable<ColorPickerProps['onChangeComplete']>;
  onFontSizeChange: (value: number) => void;
};

export const MapStylesRegionLabelsSection: FC<RegionLabelsSectionProps> = ({
  regionLabels,
  onShowChange,
  onColorChange,
  onFontSizeChange,
}) => {
  const { t } = useTypedTranslation();

  return (
    <Flex vertical gap="small">
      <Flex align="center" justify="space-between">
        <Typography.Text
          className="text-sm text-gray-600"
          id="show-region-labels-label"
          data-i18n-key="visualizer.mapStyles.showLabels"
        >
          {t('visualizer.mapStyles.showLabels')}
        </Typography.Text>
        <Switch
          checked={regionLabels.show}
          size="small"
          onChange={onShowChange}
          aria-labelledby="show-region-labels-label"
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
          value={regionLabels.color}
          onChangeComplete={onColorChange}
          size="small"
          disabled={!regionLabels.show}
        />
      </Flex>
      <Flex align="center" justify="space-between">
        <Typography.Text
          className="text-sm text-gray-600"
          id="region-labels-font-size-label"
          data-i18n-key="visualizer.mapStyles.fontSize"
        >
          {t('visualizer.mapStyles.fontSize')}
        </Typography.Text>
        <Flex align="center" gap="small" className="w-1/2">
          <Slider
            min={6}
            max={24}
            step={1}
            value={regionLabels.fontSize}
            onChange={onFontSizeChange}
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
  );
};
