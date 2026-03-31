import { type FC, useCallback, useState } from 'react';
import { Flex, Input, Modal, Typography } from 'antd';
import type { Project } from '@/api/projects/types';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type Props = {
  project: Project | null;
  onConfirm: (newName: string) => void | Promise<void>;
  onCancel: () => void;
  confirmLoading?: boolean;
};

const RenameProjectModal: FC<Props> = ({
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
    <Modal
      title={t('visualizer.renameProjectTitle')}
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
      <Flex vertical gap="small" className="py-sm">
        <Typography.Text>{t('visualizer.renameProjectPrompt')}</Typography.Text>
        <Input
          value={draftName}
          onChange={handleInputChange}
          onPressEnter={handleSubmit}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
      </Flex>
    </Modal>
  );
};

export default RenameProjectModal;
