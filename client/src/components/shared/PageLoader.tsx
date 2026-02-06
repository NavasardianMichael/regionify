import { type FC } from 'react';
import { Flex, Spin } from 'antd';

export const PageLoader: FC = () => (
  <Flex align="center" justify="center" className="h-full w-full">
    <Spin size="large" />
  </Flex>
);
