import { type FC, type ReactNode } from 'react';
import { Button, Flex } from 'antd';

type FooterProps = {
  isStreaming: boolean;
  hasInput: boolean;
  isDirty: boolean;
  cancelLabel: string;
  saveLabel: string;
  parsingLabel: string;
  submitLabel: string;
  submitIcon: ReactNode;
  hideSubmit?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onApply: () => void;
};

export const Footer: FC<FooterProps> = ({
  isStreaming,
  hasInput,
  isDirty,
  cancelLabel,
  saveLabel,
  parsingLabel,
  submitLabel,
  submitIcon,
  hideSubmit = false,
  onClose,
  onSubmit,
  onApply,
}) => (
  <Flex justify={hideSubmit ? 'flex-end' : 'space-between'} align="center" gap="small">
    {!hideSubmit && (
      <Button
        color="cyan"
        variant="solid"
        icon={submitIcon}
        onClick={() => void onSubmit()}
        loading={isStreaming}
        disabled={isStreaming || !hasInput}
      >
        {isStreaming ? parsingLabel : submitLabel}
      </Button>
    )}
    <Flex gap="small">
      <Button onClick={onClose} disabled={isStreaming}>
        {cancelLabel}
      </Button>
      <Button type="primary" onClick={onApply} disabled={isStreaming || !isDirty}>
        {saveLabel}
      </Button>
    </Flex>
  </Flex>
);
