import { type FC } from 'react';
import { Button, Flex } from 'antd';

type Phase = 'input' | 'streaming' | 'result' | 'error';

type FooterProps = {
  phase: Phase;
  isStreaming: boolean;
  hasInput: boolean;
  cancelLabel: string;
  saveLabel: string;
  parsingLabel: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: () => void;
  onApply: () => void;
};

export const Footer: FC<FooterProps> = ({
  phase,
  isStreaming,
  hasInput,
  cancelLabel,
  saveLabel,
  parsingLabel,
  submitLabel,
  onClose,
  onSubmit,
  onApply,
}) => {
  if (phase === 'result') {
    return (
      <Flex justify="flex-end" gap="small">
        <Button onClick={onClose}>{cancelLabel}</Button>
        <Button type="primary" onClick={onApply}>
          {saveLabel}
        </Button>
      </Flex>
    );
  }
  return (
    <Flex justify="flex-end" gap="small">
      <Button onClick={onClose}>{cancelLabel}</Button>
      <Button
        type="primary"
        onClick={() => void onSubmit()}
        loading={isStreaming}
        disabled={isStreaming || !hasInput}
      >
        {isStreaming ? parsingLabel : submitLabel}
      </Button>
    </Flex>
  );
};
