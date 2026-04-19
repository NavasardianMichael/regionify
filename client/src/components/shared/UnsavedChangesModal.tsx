import { type FC } from 'react';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
type Props = {
  open: boolean;
  canSave: boolean;
  isSaving: boolean;
  onDiscard: () => void;
  onSaveAndLeave: () => void;
  onCancel: () => void;
};

export const UnsavedChangesModal: FC<Props> = ({
  open,
  canSave,
  isSaving,
  onDiscard,
  onSaveAndLeave,
  onCancel,
}) => {
  const { t } = useTypedTranslation();

  return (
    <Modal
      className="scrollbar-modal-host"
      destroyOnHidden
      open={open}
      title={
        <Flex align="center" gap="small">
          <ExclamationCircleOutlined className="text-lg text-red-700!" />
          {t('visualizer.unsavedGuard.title')}
        </Flex>
      }
      onCancel={onCancel}
      centered
      maskClosable={false}
      footer={
        <Flex justify="end" gap="small">
          <Button onClick={onDiscard} disabled={isSaving}>
            {t('visualizer.unsavedGuard.discard')}
          </Button>
          {canSave && (
            <Button type="primary" loading={isSaving} onClick={onSaveAndLeave}>
              {t('visualizer.unsavedGuard.saveAndLeave')}
            </Button>
          )}
        </Flex>
      }
    >
      <Typography.Text>{t('visualizer.unsavedGuard.body')}</Typography.Text>
    </Modal>
  );
};
