import { type FC, useCallback } from 'react';
import { Flex, Input, Modal, Typography } from 'antd';
import type { Project } from '@/api/projects/types';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type Props = {
  project: Project | null;
  name: string;
  onNameChange: (name: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
};

const RenameProjectModal: FC<Props> = ({
  project,
  name,
  onNameChange,
  onConfirm,
  onCancel,
  confirmLoading = false,
}) => {
  const { t } = useTypedTranslation();

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onNameChange(e.target.value);
    },
    [onNameChange],
  );

  return (
    <Modal
      title={t('visualizer.renameProjectTitle')}
      open={project !== null}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={t('visualizer.renameProjectOk')}
      confirmLoading={confirmLoading}
      closable={{ disabled: confirmLoading }}
      centered
      okButtonProps={{
        disabled: !name.trim() || name.trim() === project?.name,
      }}
    >
      <Flex vertical gap="small" className="py-sm">
        <Typography.Text>{t('visualizer.renameProjectPrompt')}</Typography.Text>
        <Input
          value={name}
          onChange={handleInputChange}
          onPressEnter={onConfirm}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
      </Flex>
    </Modal>
  );
};

export default RenameProjectModal;
