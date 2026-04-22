import { type ChangeEventHandler, type FC } from 'react';
import { Input, Spin } from 'antd';

type BodyProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  disabled: boolean;
  isStreaming: boolean;
};

const TEXTAREA_FILL_STYLE = { resize: 'none' as const, height: '100%' };

export const Body: FC<BodyProps> = ({ value, onChange, placeholder, disabled, isStreaming }) => (
  <div className="relative min-h-0 flex-1 overflow-auto">
    <Input.TextArea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="h-full! font-mono text-sm"
      classNames={{ textarea: 'scrollbar-thin disabled:bg-white!' }}
      styles={{ textarea: TEXTAREA_FILL_STYLE }}
    />
    {isStreaming && (
      <div className="absolute top-2 right-2 z-10">
        <Spin size="small" />
      </div>
    )}
  </div>
);
