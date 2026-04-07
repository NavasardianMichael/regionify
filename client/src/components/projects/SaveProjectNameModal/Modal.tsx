import { type FC } from 'react';
import { Modal as AntModal } from 'antd';
import { Body } from './Body';

type Props = {
  open: boolean;
  title: string;
  prompt: string;
  placeholder: string;
  okText: string;
  projectName: string;
  okDisabled: boolean;
  onProjectNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOk: () => void;
  onCancel: () => void;
};

export const SaveProjectNameModal: FC<Props> = ({
  open,
  title,
  prompt,
  placeholder,
  okText,
  projectName,
  okDisabled,
  onProjectNameChange,
  onOk,
  onCancel,
}) => (
  <AntModal
    title={title}
    open={open}
    onOk={onOk}
    onCancel={onCancel}
    okText={okText}
    okButtonProps={{ disabled: okDisabled }}
    centered
  >
    <Body
      prompt={prompt}
      placeholder={placeholder}
      projectName={projectName}
      onProjectNameChange={onProjectNameChange}
      onPressEnter={onOk}
    />
  </AntModal>
);
