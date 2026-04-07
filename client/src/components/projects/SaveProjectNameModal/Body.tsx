import { type FC } from 'react';
import { Flex, Input, Typography } from 'antd';

type BodyProps = {
  prompt: string;
  placeholder: string;
  projectName: string;
  onProjectNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPressEnter: () => void;
};

export const Body: FC<BodyProps> = ({
  prompt,
  placeholder,
  projectName,
  onProjectNameChange,
  onPressEnter,
}) => (
  <Flex vertical gap="small" className="py-sm">
    <Typography.Text>{prompt}</Typography.Text>
    <Input
      placeholder={placeholder}
      value={projectName}
      onChange={onProjectNameChange}
      onPressEnter={onPressEnter}
    />
  </Flex>
);
