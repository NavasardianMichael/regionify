import { type FC } from 'react';
import { Modal, Typography } from 'antd';
import type { Project } from '@/api/projects/types';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type Props = {
  project: Project | null;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
};

const DeleteProjectModal: FC<Props> = ({
  project,
  onConfirm,
  onCancel,
  confirmLoading = false,
}) => {
  const { t } = useTypedTranslation();

  return (
    <Modal
      title={t('messages.deleteProjectTitle')}
      open={project !== null}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={t('messages.deleteProjectOk')}
      okButtonProps={{ danger: true }}
      confirmLoading={confirmLoading}
      closable={{ disabled: confirmLoading }}
      centered
      maskClosable={false}
    >
      <Typography.Paragraph className="py-sm mb-0!">
        {t('messages.deleteProjectContent', { name: project?.name ?? '' })}
      </Typography.Paragraph>
    </Modal>
  );
};

export default DeleteProjectModal;
