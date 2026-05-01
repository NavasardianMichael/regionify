import { type FC } from 'react';
import { Modal as AntModal } from 'antd';
import type { Project } from '@/api/projects/types';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { Body } from './Body';

type Props = {
  project: Project | null;
  /** When non-empty, modal shows bulk-delete copy; use `project: null` in this mode. */
  projectsBulk?: Project[] | null;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmLoading?: boolean;
};

export const DeleteProjectModal: FC<Props> = ({
  project,
  projectsBulk = null,
  onConfirm,
  onCancel,
  confirmLoading = false,
}) => {
  const { t } = useTypedTranslation();

  const isBulk = projectsBulk != null && projectsBulk.length > 0;
  const open = project !== null || isBulk;

  const title = isBulk ? t('messages.deleteProjectsBulkTitle') : t('messages.deleteProjectTitle');

  const bodyContent = isBulk
    ? t('messages.deleteProjectsBulkContent', { count: projectsBulk!.length })
    : t('messages.deleteProjectContent', { name: project?.name ?? '' });

  const bodyI18nKey = isBulk
    ? 'messages.deleteProjectsBulkContent'
    : 'messages.deleteProjectContent';

  return (
    <AntModal
      className="scrollbar-modal-host"
      title={title}
      destroyOnHidden
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={t('messages.deleteProjectOk')}
      okButtonProps={{ danger: true }}
      confirmLoading={confirmLoading}
      closable={{ disabled: confirmLoading }}
      centered
      maskClosable={false}
    >
      <Body content={bodyContent} data-i18n-key={bodyI18nKey} />
    </AntModal>
  );
};
