import { type FC } from 'react';
import { Flex, Input, Typography } from 'antd';

type BodyProps = {
  text: string;
  placeholder: string;
  error: string | null;
  onTextChange: (value: string) => void;
};

export const Body: FC<BodyProps> = ({ text, placeholder, error, onTextChange }) => (
  <Flex vertical gap="small" className="py-md">
    <Input.TextArea
      value={text}
      onChange={(e) => onTextChange(e.target.value)}
      placeholder={placeholder}
      rows={14}
      className="font-mono text-sm"
      styles={{ textarea: { resize: 'none' } }}
    />
    {error ? (
      <Typography.Text type="danger" className="text-sm">
        {error}
      </Typography.Text>
    ) : null}
  </Flex>
);
