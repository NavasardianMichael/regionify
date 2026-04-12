import { type FC } from 'react';
import { Button, Flex } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type Props = {
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export const Footer: FC<Props> = ({ submitting, onClose, onSubmit }) => {
  const { t } = useTypedTranslation();

  return (
    <Flex justify="flex-end" gap="small">
      <Button onClick={onClose} disabled={submitting} data-i18n-key="nav.cancel">
        {t('nav.cancel')}
      </Button>
      <Button
        type="primary"
        loading={submitting}
        onClick={onSubmit}
        data-i18n-key="visualizer.save"
      >
        {t('visualizer.save')}
      </Button>
    </Flex>
  );
};
