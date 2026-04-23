import { type FC } from 'react';
import {
  ColorPicker,
  type ColorPickerProps,
  Flex,
  InputNumber,
  Slider,
  Switch,
  type SwitchProps,
  Typography,
} from 'antd';
import type { ShadowConfig } from '@/store/mapStyles/types';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type ShadowSectionProps = {
  shadow: ShadowConfig;
  localOffsetX: number;
  localOffsetY: number;
  onShowChange: NonNullable<SwitchProps['onChange']>;
  onColorChange: NonNullable<ColorPickerProps['onChangeComplete']>;
  onBlurChange: (value: number) => void;
  onOffsetXChange: (value: number | null) => void;
  onOffsetYChange: (value: number | null) => void;
};

export const MapStylesShadowSection: FC<ShadowSectionProps> = ({
  shadow,
  localOffsetX,
  localOffsetY,
  onShowChange,
  onColorChange,
  onBlurChange,
  onOffsetXChange,
  onOffsetYChange,
}) => {
  const { t } = useTypedTranslation();

  return (
    <Flex vertical gap="small">
      <Flex align="center" justify="space-between">
        <Typography.Text
          className="text-sm text-gray-600"
          id="show-shadow-label"
          data-i18n-key="visualizer.mapStyles.showShadow"
        >
          {t('visualizer.mapStyles.showShadow')}
        </Typography.Text>
        <Switch
          checked={shadow.show}
          size="small"
          onChange={onShowChange}
          aria-labelledby="show-shadow-label"
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
          value={shadow.color}
          onChangeComplete={onColorChange}
          size="small"
          disabled={!shadow.show}
        />
      </Flex>
      <Flex align="center" justify="space-between">
        <Typography.Text
          className="text-sm text-gray-600"
          id="shadow-blur-label"
          data-i18n-key="visualizer.mapStyles.blur"
        >
          {t('visualizer.mapStyles.blur')}
        </Typography.Text>
        <Flex align="center" gap="small" className="w-1/2">
          <Slider
            min={0}
            max={30}
            value={shadow.blur}
            onChange={onBlurChange}
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
        <Typography.Text
          className="text-sm text-gray-600"
          data-i18n-key="visualizer.mapStyles.offsetX"
        >
          {t('visualizer.mapStyles.offsetX')}
        </Typography.Text>
        <InputNumber
          value={localOffsetX}
          onChange={onOffsetXChange}
          size="small"
          className="w-20"
          disabled={!shadow.show}
        />
      </Flex>
      <Flex align="center" justify="space-between">
        <Typography.Text
          className="text-sm text-gray-600"
          data-i18n-key="visualizer.mapStyles.offsetY"
        >
          {t('visualizer.mapStyles.offsetY')}
        </Typography.Text>
        <InputNumber
          value={localOffsetY}
          onChange={onOffsetYChange}
          size="small"
          className="w-20"
          disabled={!shadow.show}
        />
      </Flex>
    </Flex>
  );
};
