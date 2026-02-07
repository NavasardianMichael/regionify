import { type FC, useCallback } from 'react';

import { Flex, Input, Modal, Typography } from 'antd';

import type { Project } from '@/api/projects/types';

type Props = {
  project: Project | null;
  name: string;
  onNameChange: (name: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

const RenameProjectModal: FC<Props> = ({ project, name, onNameChange, onConfirm, onCancel }) => {
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onNameChange(e.target.value);
    },
    [onNameChange],
  );

  return (
    <Modal
      title="Rename Project"
      open={project !== null}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="Rename"
      okButtonProps={{
        disabled: !name.trim() || name.trim() === project?.name,
      }}
    >
      <Flex vertical gap="small" className="py-sm">
        <Typography.Text>Enter a new name:</Typography.Text>
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
