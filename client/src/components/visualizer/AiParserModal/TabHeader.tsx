import { type FC, type ReactNode } from 'react';
import { Flex, Typography } from 'antd';

type Props = {
  note: string;
  accuracyNote: string;
  switchViewButton: ReactNode;
};

export const TabHeader: FC<Props> = ({ note, accuracyNote, switchViewButton }) => (
  <Flex justify="space-between" align="center" gap="small" className="shrink-0">
    <Flex vertical>
      <Typography.Text type="secondary" className="text-xs">
        {note}
      </Typography.Text>
      <Typography.Text type="secondary" className="text-xs">
        {accuracyNote}
      </Typography.Text>
    </Flex>
    {switchViewButton}
  </Flex>
);
