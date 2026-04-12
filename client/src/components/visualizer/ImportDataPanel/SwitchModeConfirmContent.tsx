import { type FC } from 'react';
import { Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

/** Confirm body when switching static/dynamic dataset mode in Import Data panel. */
export const SwitchModeConfirmContent: FC = () => {
  const { t } = useTypedTranslation();

  return (
    <Flex vertical gap="small">
      <Typography.Text data-i18n-key="visualizer.switchMode.body">
        {t('visualizer.switchMode.body')}
      </Typography.Text>
      <Typography.Text
        type="secondary"
        className="text-xs"
        data-i18n-key="visualizer.switchMode.hint"
      >
        {t('visualizer.switchMode.hint')}
      </Typography.Text>
    </Flex>
  );
};
