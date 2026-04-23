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
import type { BorderConfig } from '@/store/mapStyles/types';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type BorderSectionProps = {
  border: BorderConfig;
  onShowChange: NonNullable<SwitchProps['onChange']>;
  onColorChange: NonNullable<ColorPickerProps['onChangeComplete']>;
  onWidthChange: (value: number) => void;
};

export const MapStylesBorderSection: FC<BorderSectionProps> = ({
  border,
  onShowChange,
  onColorChange,
  onWidthChange,
}) => {
  const { t } = useTypedTranslation();

  return (
    <Flex vertical gap="small">
      <Flex align="center" justify="space-between">
        <Typography.Text
          className="text-sm text-gray-600"
          id="show-border-label"
          data-i18n-key="visualizer.mapStyles.showBorder"
        >
          {t('visualizer.mapStyles.showBorder')}
        </Typography.Text>
        <Switch
          checked={border.show}
          size="small"
          onChange={onShowChange}
          aria-labelledby="show-border-label"
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
          value={border.color}
          onChangeComplete={onColorChange}
          size="small"
          disabled={!border.show}
        />
      </Flex>
      <Flex align="center" justify="space-between">
        <Typography.Text
          className="text-sm text-gray-600"
          id="border-width-label"
          data-i18n-key="visualizer.mapStyles.width"
        >
          {t('visualizer.mapStyles.width')}
        </Typography.Text>
        <Flex align="center" gap="small" className="w-1/2">
          <Slider
            min={1}
            max={5}
            step={1}
            value={border.width}
            onChange={onWidthChange}
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
  );
};
