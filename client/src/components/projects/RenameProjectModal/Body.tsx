import { type FC } from 'react';
import { Flex, Input, Typography } from 'antd';

type BodyProps = {
  prompt: string;
  draftName: string;
  onDraftNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPressEnter: () => void;
};

export const Body: FC<BodyProps> = ({ prompt, draftName, onDraftNameChange, onPressEnter }) => (
  <Flex vertical gap="small" className="py-sm">
    <Typography.Text>{prompt}</Typography.Text>
    <Input
      value={draftName}
      onChange={onDraftNameChange}
      onPressEnter={onPressEnter}
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus
    />
  </Flex>
);
