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
        <Typography.Text type="secondary" className="mb-2 text-[13px]">
          {t('visualizer.mapStyles.freePlanNote')}{' '}
          <a href={ROUTES.BILLING} className="text-[#1677ff]">
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
