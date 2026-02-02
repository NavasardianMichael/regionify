import type { FC } from 'react';
import { Flex, Typography } from 'antd';

const AboutPage: FC = () => {
  return (
    <Flex vertical gap="middle">
      <Typography.Title level={1} className="text-primary text-3xl font-bold">
        About
      </Typography.Title>
      <Typography.Paragraph className="text-gray-600">
        Learn more about this application.
      </Typography.Paragraph>
    </Flex>
  );
};

export default AboutPage;
