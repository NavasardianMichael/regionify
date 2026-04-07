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
      <Button onClick={onClose} disabled={submitting}>
        {t('nav.cancel')}
      </Button>
      <Button type="primary" loading={submitting} onClick={onSubmit}>
        {t('visualizer.save')}
      </Button>
    </Flex>
  );
};
