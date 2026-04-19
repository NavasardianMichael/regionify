import { type FC, useCallback, useState } from 'react';
import { Modal as AntModal } from 'antd';
import type { Project } from '@/api/projects/types';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import modalBodyScrollbarStyles from '@/components/shared/modalBodyScrollbar.module.css';
import { Body } from './Body';

type Props = {
  project: Project | null;
  onConfirm: (newName: string) => void | Promise<void>;
  onCancel: () => void;
  confirmLoading?: boolean;
};

export const RenameProjectModal: FC<Props> = ({
  project,
  onConfirm,
  onCancel,
  confirmLoading = false,
}) => {
  const { t } = useTypedTranslation();
  const [draftName, setDraftName] = useState(() => project?.name ?? '');

  const isOpen = project !== null;

  const handleAfterOpenChange = useCallback(
    (open: boolean) => {
      if (open && project) {
        setDraftName(project.name);
      }
    },
    [project],
  );

  const handleSubmit = useCallback(() => {
    if (!project) return;
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === project.name) {
      onCancel();
      return;
    }
    return onConfirm(trimmed);
  }, [draftName, project, onConfirm, onCancel]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftName(e.target.value);
  }, []);

  return (
    <AntModal
      className={modalBodyScrollbarStyles.bodyScrollbar}
      title={t('visualizer.renameProjectTitle')}
      destroyOnHidden
      open={isOpen}
      afterOpenChange={handleAfterOpenChange}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText={t('visualizer.renameProjectOk')}
      confirmLoading={confirmLoading}
      closable={{ disabled: confirmLoading }}
      maskClosable={false}
      centered
      okButtonProps={{
        disabled: !draftName.trim() || draftName.trim() === project?.name,
      }}
    >
      <Body
        prompt={t('visualizer.renameProjectPrompt')}
        draftName={draftName}
        onDraftNameChange={handleInputChange}
        onPressEnter={handleSubmit}
        data-i18n-key="visualizer.renameProjectPrompt"
      />
    </AntModal>
  );
};
