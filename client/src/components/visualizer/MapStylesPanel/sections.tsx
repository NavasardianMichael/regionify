import { type FC } from 'react';
import { PLANS } from '@regionify/shared';
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
import type {
  BorderConfig,
  PictureConfig,
  RegionLabelsConfig,
  ShadowConfig,
  ZoomControlsConfig,
} from '@/store/mapStyles/types';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type BackgroundSectionProps = {
  plan: string;
  picture: PictureConfig;
  onTransparentChange: NonNullable<SwitchProps['onChange']>;
  onBackgroundColorChange: NonNullable<ColorPickerProps['onChangeComplete']>;
};

export const MapStylesBackgroundSection: FC<BackgroundSectionProps> = ({
  plan,
  picture,
  onTransparentChange,
  onBackgroundColorChange,
}) => {
  const { t } = useTypedTranslation();

  return (
    <Flex vertical gap="small">
      {plan === PLANS.observer && (
        <Typography.Text type="secondary" style={{ fontSize: 13, marginBottom: 8 }}>
          {t('visualizer.mapStyles.freePlanNote')}{' '}
          <a href={ROUTES.BILLING} style={{ color: '#1677ff' }}>
            {t('visualizer.mapStyles.upgradePlanLink')}
          </a>
          .
        </Typography.Text>
      )}
      <Flex align="center" justify="space-between">
        <Typography.Text className="text-sm text-gray-600" id="transparent-bg-label">
          {t('visualizer.mapStyles.transparent')}
        </Typography.Text>
        <Switch
          checked={picture.transparentBackground}
          size="small"
          onChange={onTransparentChange}
          aria-labelledby="transparent-bg-label"
          disabled={plan === PLANS.observer}
        />
      </Flex>
      <Flex align="center" justify="space-between">
        <Typography.Text className="text-sm text-gray-600">
          {t('visualizer.mapStyles.color')}
        </Typography.Text>
        <ColorPicker
          value={picture.backgroundColor}
          onChangeComplete={onBackgroundColorChange}
          size="small"
          disabled={picture.transparentBackground}
        />
      </Flex>
    </Flex>
  );
};

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
        <Typography.Text className="text-sm text-gray-600" id="show-border-label">
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
        <Typography.Text className="text-sm text-gray-600">
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
        <Typography.Text className="text-sm text-gray-600" id="border-width-label">
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
        <Typography.Text className="text-sm text-gray-600" id="show-shadow-label">
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
        <Typography.Text className="text-sm text-gray-600">
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
        <Typography.Text className="text-sm text-gray-600" id="shadow-blur-label">
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
        <Typography.Text className="text-sm text-gray-600">
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
        <Typography.Text className="text-sm text-gray-600">
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

type ZoomSectionProps = {
  zoomControls: ZoomControlsConfig;
  onShowChange: NonNullable<SwitchProps['onChange']>;
};

export const MapStylesZoomSection: FC<ZoomSectionProps> = ({ zoomControls, onShowChange }) => {
  const { t } = useTypedTranslation();

  return (
    <Flex vertical gap="small">
      <Flex align="center" justify="space-between">
        <Typography.Text className="text-sm text-gray-600" id="show-controls-label">
          {t('visualizer.mapStyles.showControls')}
        </Typography.Text>
        <Switch
          checked={zoomControls.show}
          size="small"
          onChange={onShowChange}
          aria-labelledby="show-controls-label"
        />
      </Flex>
    </Flex>
  );
};

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
        <Typography.Text className="text-sm text-gray-600" id="show-region-labels-label">
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
        <Typography.Text className="text-sm text-gray-600">
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
        <Typography.Text className="text-sm text-gray-600" id="region-labels-font-size-label">
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
