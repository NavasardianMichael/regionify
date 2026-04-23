import { type FC } from 'react';
import { VideoCameraOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

export const Title: FC = () => (
  <Flex align="center" gap="small" className="mb-4!">
    <VideoCameraOutlined className="text-primary" />
    <Typography.Title level={4} className="mb-0!">
      Export Animation
    </Typography.Title>
  </Flex>
);
