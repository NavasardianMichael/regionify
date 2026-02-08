import { type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Flex, Typography } from 'antd';

import { ROUTES } from '@/constants/routes';

const PaymentCancelPage: FC = () => {
  const navigate = useNavigate();

  return (
    <Flex vertical align="center" justify="center" className="h-full w-full" gap="middle">
      <Typography.Title level={3}>Payment cancelled</Typography.Title>
      <Typography.Text type="secondary">
        You cancelled the payment. No charges were made.
      </Typography.Text>
      <Button type="primary" onClick={() => navigate(ROUTES.BILLING)}>
        Back to Billing
      </Button>
    </Flex>
  );
};

export default PaymentCancelPage;
