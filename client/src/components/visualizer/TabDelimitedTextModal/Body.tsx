import { type FC } from 'react';
import { Flex, Input, Typography } from 'antd';
import type { TextAreaStylesType } from 'antd/es/input/TextArea';

const TEXTAREA_FILL_STYLE: TextAreaStylesType = {
  textarea: { resize: 'none', height: '100%', overflowY: 'auto' },
};

const TEXTAREA_CLASSNAMES = {
  textarea: 'scrollbar-thin',
};

type BodyProps = {
  text: string;
  placeholder: string;
  error: string | null;
  onTextChange: (value: string) => void;
};

export const Body: FC<BodyProps> = ({ text, placeholder, error, onTextChange }) => (
  <Flex vertical gap="small" className="py-md min-h-0 flex-1">
    <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
      <Input.TextArea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={placeholder}
        className="h-full! font-mono text-sm"
        classNames={TEXTAREA_CLASSNAMES}
        styles={TEXTAREA_FILL_STYLE}
      />
    </div>
    {error ? (
      <Typography.Text type="danger" className="shrink-0 text-sm">
        {error}
      </Typography.Text>
    ) : null}
  </Flex>
);
