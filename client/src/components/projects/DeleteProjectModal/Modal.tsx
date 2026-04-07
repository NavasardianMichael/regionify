import { type FC } from 'react';
import { Modal as AntModal } from 'antd';
import type { Project } from '@/api/projects/types';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { Body } from './Body';

type Props = {
  project: Project | null;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
};

export const DeleteProjectModal: FC<Props> = ({
  project,
  onConfirm,
  onCancel,
  confirmLoading = false,
}) => {
  const { t } = useTypedTranslation();

  return (
    <AntModal
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
      <Body content={t('messages.deleteProjectContent', { name: project?.name ?? '' })} />
    </AntModal>
  );
};
