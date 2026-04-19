import { type FC, type ReactNode } from 'react';
import { Flex, Typography } from 'antd';

type Props = {
  note: string;
  switchViewButton: ReactNode;
};

export const TabHeader: FC<Props> = ({ note, switchViewButton }) => (
  <Flex justify="space-between" align="center" gap="small">
    <Typography.Text type="secondary" className="text-xs">
      {note}
    </Typography.Text>
    {switchViewButton}
  </Flex>
);
