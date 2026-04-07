import { type FC } from 'react';
import { Button, Flex } from 'antd';

type FooterProps = {
  cancelLabel: string;
  doneLabel: string;
  onCancel: () => void;
  onSave: () => void;
};

export const Footer: FC<FooterProps> = ({ cancelLabel, doneLabel, onCancel, onSave }) => (
  <Flex justify="end" gap="middle">
    <Button onClick={onCancel}>{cancelLabel}</Button>
    <Button type="primary" onClick={onSave}>
      {doneLabel}
    </Button>
  </Flex>
);
