import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleOutlined } from '@ant-design/icons';
import { BADGES } from '@regionify/shared';
import { Button, Flex, Spin, Typography } from 'antd';
import { getMe } from '@/api/auth';
import { selectSetUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60000;

const PaymentReturnPage: FC = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const setUser = useProfileStore(selectSetUser);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [messageText, setMessageText] = useState('');
  const [upgradedBadge, setUpgradedBadge] = useState<string | null>(null);
  const pollStartRef = useRef<number | null>(null);

  const handleContinue = useCallback(() => {
    navigate(ROUTES.PROJECTS);
  }, [navigate]);

  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pollStartRef.current === null) pollStartRef.current = Date.now();
    let cancelled = false;

    const poll = async (): Promise<void> => {
      if (cancelled) return;
      const start = pollStartRef.current ?? Date.now();
      if (Date.now() - start > POLL_TIMEOUT_MS) {
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        setStatus('success');
        setMessageText(t('badges.paymentPendingNote'));
        return;
      }
      try {
        const { user } = await getMe();
        if (cancelled) return;
        setUser(user);
        if (user.badge !== BADGES.observer) {
          if (intervalIdRef.current) clearInterval(intervalIdRef.current);
          setUpgradedBadge(user.badge);
          setStatus('success');
          setMessageText(`You're now on the ${user.badge} badge.`);
          return;
        }
      } catch {
        if (!cancelled) {
          if (intervalIdRef.current) clearInterval(intervalIdRef.current);
          setStatus('error');
          setMessageText(t('badges.verifyErrorNote'));
        }
      }
    };

    void poll();
    intervalIdRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [setUser, t]);

  if (status === 'loading') {
    return (
      <Flex vertical align="center" justify="center" className="h-full w-full" gap="middle">
        <Spin size="large" />
        <Typography.Text>Payment successful. Updating your badge...</Typography.Text>
      </Flex>
    );
  }

  if (status === 'error') {
    return (
      <Flex vertical align="center" justify="center" className="h-full w-full" gap="middle">
        <Typography.Text type="danger">{messageText}</Typography.Text>
        <Button
          type="primary"
          onClick={() => navigate(ROUTES.BILLING)}
          data-i18n-key="badges.backToBadges"
        >
          {t('badges.backToBadges')}
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
      {!upgradedBadge && (
        <Button
          type="link"
          onClick={() => navigate(ROUTES.BILLING)}
          data-i18n-key="badges.goToBadges"
        >
          {t('badges.goToBadges')}
        </Button>
      )}
    </Flex>
  );
};

export default PaymentReturnPage;
