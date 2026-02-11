import { type FC, useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Spin, Typography } from 'antd';
import { getAuthStatus } from '@/api/auth/status';
import { captureOrder } from '@/api/payments';
import { selectSetUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';

const PaymentReturnPage: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useProfileStore(selectSetUser);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [messageText, setMessageText] = useState('');

  const token = searchParams.get('token');

  const handleContinue = useCallback(() => {
    navigate(ROUTES.PROJECTS);
  }, [navigate]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    const run = async (): Promise<void> => {
      try {
        const result = await captureOrder({ orderId: token });
        if (cancelled) return;
        const authData = await getAuthStatus();
        if (authData.authenticated && authData.user) {
          setUser(authData.user);
        }
        setStatus('success');
        setMessageText(`You're now on the ${result.plan} plan.`);
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessageText('Payment could not be completed. Please try again or contact support.');
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [token, setUser]);

  if (!token) {
    return (
      <Flex vertical align="center" justify="center" className="h-full w-full" gap="middle">
        <Typography.Text type="danger">No order ID in URL.</Typography.Text>
        <Button type="primary" onClick={() => navigate(ROUTES.BILLING)}>
          Back to Billing
        </Button>
      </Flex>
    );
  }

  if (status === 'loading') {
    return (
      <Flex vertical align="center" justify="center" className="h-full w-full" gap="middle">
        <Spin size="large" />
        <Typography.Text>Completing your payment...</Typography.Text>
      </Flex>
    );
  }

  if (status === 'error') {
    return (
      <Flex vertical align="center" justify="center" className="h-full w-full" gap="middle">
        <Typography.Text type="danger">{messageText}</Typography.Text>
        <Button type="primary" onClick={() => navigate(ROUTES.BILLING)}>
          Back to Billing
        </Button>
      </Flex>
    );
  }

  return (
    <Flex vertical align="center" justify="center" className="h-full w-full" gap="middle">
      <CheckCircleOutlined className="text-6xl text-green-500" />
      <Typography.Title level={3}>Payment successful</Typography.Title>
      <Typography.Text type="secondary">{messageText}</Typography.Text>
      <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleContinue}>
        Continue to My Projects
      </Button>
    </Flex>
  );
};

export default PaymentReturnPage;
