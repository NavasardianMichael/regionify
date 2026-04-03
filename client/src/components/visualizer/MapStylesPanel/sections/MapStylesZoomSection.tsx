import { type FC } from 'react';
import { Flex, Switch, type SwitchProps, Typography } from 'antd';
import type { ZoomControlsConfig } from '@/store/mapStyles/types';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

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
