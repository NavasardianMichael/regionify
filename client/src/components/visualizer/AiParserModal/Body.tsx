import { type FC } from 'react';
import { Badge, Flex, Input, Spin, Typography } from 'antd';

type BodyProps = {
  limitedRequestsNote: string;
  requestsRemainingTitle: string;
  remaining: number;
  placeholder: string;
  inputText: string;
  onInputChange: (value: string) => void;
  showOutput: boolean;
  outputText: string;
  isStreaming: boolean;
};

export const Body: FC<BodyProps> = ({
  limitedRequestsNote,
  requestsRemainingTitle,
  remaining,
  placeholder,
  inputText,
  onInputChange,
  showOutput,
  outputText,
  isStreaming,
}) => (
  <Flex vertical gap="small" className="py-md">
    <Flex justify="space-between" align="center">
      <Typography.Text type="secondary" className="text-xs">
        {limitedRequestsNote}
      </Typography.Text>
      <Badge
        count={remaining}
        showZero
        color={remaining > 0 ? 'blue' : 'red'}
        size="small"
        title={requestsRemainingTitle}
      />
    </Flex>
    {showOutput ? (
      <Flex vertical gap="xs">
        <Input.TextArea
          value={outputText}
          readOnly
          rows={14}
          className="font-mono text-sm"
          classNames={{ textarea: 'scrollbar-thin' }}
          styles={{ textarea: { resize: 'none' } }}
        />
        {isStreaming && (
          <Flex justify="center">
            <Spin size="small" />
          </Flex>
        )}
      </Flex>
    ) : (
      <Input.TextArea
        value={inputText}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder={placeholder}
        rows={14}
        className="font-mono text-sm"
        classNames={{ textarea: 'scrollbar-thin' }}
        styles={{ textarea: { resize: 'none' } }}
      />
    )}
  </Flex>
);
