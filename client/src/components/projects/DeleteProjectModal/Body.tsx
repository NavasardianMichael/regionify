import { type FC } from 'react';
import { Typography } from 'antd';

type BodyProps = {
  content: string;
};

export const Body: FC<BodyProps> = ({ content }) => (
  <Typography.Paragraph className="py-sm mb-0!">{content}</Typography.Paragraph>
);
