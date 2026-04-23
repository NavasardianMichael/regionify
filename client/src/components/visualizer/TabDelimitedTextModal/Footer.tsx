import { type FC } from 'react';
import { Button, Flex } from 'antd';

type FooterProps = {
  cancelLabel: string;
  saveLabel: string;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
};

export const Footer: FC<FooterProps> = ({ cancelLabel, saveLabel, saving, onCancel, onSave }) => (
  <Flex justify="flex-end" gap="small">
    <Button onClick={onCancel}>{cancelLabel}</Button>
    <Button type="primary" onClick={() => void onSave()} loading={saving}>
      {saveLabel}
    </Button>
  </Flex>
);
