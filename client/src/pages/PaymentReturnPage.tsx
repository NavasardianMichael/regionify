import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleOutlined } from '@ant-design/icons';
import { PLANS } from '@regionify/shared';
import { Button, Flex, Spin, Typography } from 'antd';
import { getMe } from '@/api/auth';
import { selectSetUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60000;

const PaymentReturnPage: FC = () => {
  const navigate = useNavigate();
  const setUser = useProfileStore(selectSetUser);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [messageText, setMessageText] = useState('');
  const [upgradedPlan, setUpgradedPlan] = useState<string | null>(null);
  const pollStartRef = useRef<number>(Date.now());

  const handleContinue = useCallback(() => {
    navigate(ROUTES.PROJECTS);
  }, [navigate]);

  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async (): Promise<void> => {
      if (cancelled) return;
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        setStatus('success');
        setMessageText(
          'Payment received. Your plan may take a moment to update. Refresh the page or check Billing.',
        );
        return;
      }
      try {
        const { user } = await getMe();
        if (cancelled) return;
        setUser(user);
        if (user.plan !== PLANS.observer) {
          if (intervalIdRef.current) clearInterval(intervalIdRef.current);
          setUpgradedPlan(user.plan);
          setStatus('success');
          setMessageText(`You're now on the ${user.plan} plan.`);
          return;
        }
      } catch {
        if (!cancelled) {
          if (intervalIdRef.current) clearInterval(intervalIdRef.current);
          setStatus('error');
          setMessageText('Could not verify your plan. Please refresh or check Billing.');
        }
      }
    };

    void poll();
    intervalIdRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [setUser]);

  if (status === 'loading') {
    return (
      <Flex vertical align="center" justify="center" className="h-full w-full" gap="middle">
        <Spin size="large" />
        <Typography.Text>Payment successful. Updating your plan...</Typography.Text>
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
      {!upgradedPlan && (
        <Button type="link" onClick={() => navigate(ROUTES.BILLING)}>
          Go to Billing
        </Button>
      )}
    </Flex>
  );
};

export default PaymentReturnPage;
