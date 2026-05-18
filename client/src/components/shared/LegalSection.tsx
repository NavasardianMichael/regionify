import { type FC, type ReactNode } from 'react';
import { Flex, Typography } from 'antd';

type Props = {
  heading: string;
  children: ReactNode;
};

export const LegalSection: FC<Props> = ({ heading, children }) => (
  <Flex vertical gap="small">
    <Typography.Title level={2} className="text-primary mb-0! text-base! font-semibold">
      {heading}
    </Typography.Title>
    {children}
  </Flex>
);
