import { type FC } from 'react';
import { PLANS } from '@regionify/shared';
import {
  ColorPicker,
  type ColorPickerProps,
  Flex,
  Switch,
  type SwitchProps,
  Typography,
} from 'antd';
import type { PictureConfig } from '@/store/mapStyles/types';
import { resolveOpaqueMapBackgroundColor } from '@/constants/mapStyles';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { AppNavLink } from '@/components/ui/AppNavLink';

type BackgroundSectionProps = {
  plan: string;
  picture: PictureConfig;
  onTransparentChange: NonNullable<SwitchProps['onChange']>;
  onBackgroundColorChange: NonNullable<ColorPickerProps['onChangeComplete']>;
  onShowWatermarkChange: NonNullable<SwitchProps['onChange']>;
};

export const MapStylesBackgroundSection: FC<BackgroundSectionProps> = ({
  plan,
  picture,
  onTransparentChange,
  onBackgroundColorChange,
  onShowWatermarkChange,
}) => {
  const { t } = useTypedTranslation();
  const isObserver = plan === PLANS.observer;
  const transparentChecked = isObserver ? false : picture.transparentBackground;
  const watermarkChecked = isObserver ? true : picture.showWatermark;

  return (
    <Flex vertical gap="small">
      {isObserver && (
        <Typography.Text type="secondary" className="mb-2 text-[13px]">
          {t('visualizer.mapStyles.freePlanNoteBeforeUpgrade')}
          <AppNavLink
            to={ROUTES.BILLING}
            className="text-[13px] font-medium"
            data-i18n-key="visualizer.mapStyles.freePlanUpgradeLink"
          >
            {t('visualizer.mapStyles.freePlanUpgradeLink')}
          </AppNavLink>
          {t('visualizer.mapStyles.freePlanNoteAfterUpgrade')}
        </Typography.Text>
      )}
      <Flex align="center" justify="space-between">
        <Typography.Text
          className="text-sm text-gray-600"
          id="transparent-bg-label"
          data-i18n-key="visualizer.mapStyles.transparent"
        >
          {t('visualizer.mapStyles.transparent')}
        </Typography.Text>
        <Switch
          checked={transparentChecked}
          size="small"
          onChange={onTransparentChange}
          aria-labelledby="transparent-bg-label"
          disabled={isObserver}
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
          value={resolveOpaqueMapBackgroundColor(picture)}
          onChangeComplete={onBackgroundColorChange}
          size="small"
          disabled={picture.transparentBackground}
        />
      </Flex>
      <Flex align="center" justify="space-between">
        <Typography.Text
          className="text-sm text-gray-600"
          id="show-watermark-label"
          data-i18n-key="visualizer.mapStyles.showWatermark"
        >
          {t('visualizer.mapStyles.showWatermark')}
        </Typography.Text>
        <Switch
          checked={watermarkChecked}
          size="small"
          onChange={onShowWatermarkChange}
          aria-labelledby="show-watermark-label"
          disabled={isObserver}
        />
      </Flex>
    </Flex>
  );
};
