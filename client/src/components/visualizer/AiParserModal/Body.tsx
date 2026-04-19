import { type FC } from 'react';
import { Flex, Input, Spin, Typography } from 'antd';

type BodyProps = {
  limitedRequestsNote: string;
  placeholder: string;
  inputText: string;
  onInputChange: (value: string) => void;
  showOutput: boolean;
  outputText: string;
  onOutputChange: (value: string) => void;
  isStreaming: boolean;
};

const TEXTAREA_FILL_STYLE = { resize: 'none' as const, height: '100%' };

export const Body: FC<BodyProps> = ({
  limitedRequestsNote,
  placeholder,
  inputText,
  onInputChange,
  showOutput,
  outputText,
  onOutputChange,
  isStreaming,
}) => (
  <Flex vertical gap="small" className="py-md min-h-0 flex-1">
    <Typography.Text type="secondary" className="text-xs">
      {limitedRequestsNote}
    </Typography.Text>
    <div className="relative min-h-0 flex-1 overflow-auto">
      {showOutput ? (
        <Input.TextArea
          value={outputText}
          onChange={(e) => onOutputChange(e.target.value)}
          disabled={isStreaming}
          className="h-full! font-mono text-sm"
          classNames={{ textarea: 'scrollbar-thin disabled:bg-white!' }}
          styles={{ textarea: TEXTAREA_FILL_STYLE }}
        />
      ) : (
        <Input.TextArea
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={isStreaming}
          placeholder={placeholder}
          className="h-full! font-mono text-sm"
          classNames={{ textarea: 'scrollbar-thin disabled:bg-white!' }}
          styles={{ textarea: TEXTAREA_FILL_STYLE }}
        />
      )}
      {isStreaming && (
        <div className="absolute top-2 right-2 z-10">
          <Spin size="small" />
        </div>
      )}
    </div>
  </Flex>
);
