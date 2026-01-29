import type { FC } from 'react';
import { Flex, Typography } from 'antd';

const HomePage: FC = () => {
  return (
    <Flex vertical gap="middle">
      <Typography.Title level={1} className="text-primary text-3xl font-bold">
        Home
      </Typography.Title>
      <Typography.Paragraph className="text-gray-600">
        Welcome to the Region Map application.
      </Typography.Paragraph>
    </Flex>
  );
};

export default HomePage;
