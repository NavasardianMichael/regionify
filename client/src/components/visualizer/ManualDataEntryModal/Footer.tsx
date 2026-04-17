import { type FC } from 'react';
import { Button, Flex } from 'antd';

type FooterProps = {
  showSave: boolean;
  cancelLabel: string;
  saveLabel: string;
  onCancel: () => void;
  onSave: () => void;
};

export const Footer: FC<FooterProps> = ({ showSave, cancelLabel, saveLabel, onCancel, onSave }) => (
  <Flex justify="flex-end" gap="small">
    <Button onClick={onCancel}>{cancelLabel}</Button>
    {showSave ? (
      <Button type="primary" onClick={onSave}>
        {saveLabel}
      </Button>
    ) : null}
  </Flex>
);
