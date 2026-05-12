import { type FC, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { initializePaddle, type Paddle, type PaddleEventData } from '@paddle/paddle-js';
import { Button, Flex, Spin, Typography } from 'antd';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN?.trim() ?? '';
const PADDLE_ENVIRONMENT = import.meta.env.VITE_PADDLE_ENV === 'sandbox' ? 'sandbox' : 'production';

/**
 * Paddle.js payment-link opener page.
 *
 * Paddle Billing returns a checkout URL of the form `{CLIENT_URL}/payments/checkout?_ptxn=txn_…`.
 * When this page loads Paddle.js with that query parameter present, Paddle automatically opens
 * the overlay checkout. After the user pays we navigate to `/payments/return` (which polls until
 * the webhook flips the user's badge). If the user closes the overlay we navigate to `/payments/cancel`.
 *
 * Docs: https://developer.paddle.com/build/transactions/default-payment-link
 */
const PaymentCheckoutPage: FC = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ptxn = searchParams.get('_ptxn');
  const hasConfig = Boolean(PADDLE_CLIENT_TOKEN) && Boolean(ptxn);
  const [initFailed, setInitFailed] = useState(false);
  const paddleRef = useRef<Paddle | null>(null);

  useEffect(() => {
    if (!ptxn) {
      navigate(ROUTES.BILLING, { replace: true });
      return;
    }

    if (!PADDLE_CLIENT_TOKEN) {
      if (import.meta.env.DEV) {
        console.warn('[paddle] VITE_PADDLE_CLIENT_TOKEN is not set; checkout overlay cannot open.');
      }
      return;
    }

    let cancelled = false;

    const handleEvent = (event: PaddleEventData): void => {
      if (event.name === 'checkout.completed') {
        navigate(ROUTES.PAYMENTS_RETURN, { replace: true });
      } else if (event.name === 'checkout.closed') {
        navigate(ROUTES.PAYMENTS_CANCEL, { replace: true });
      }
    };

    initializePaddle({
      environment: PADDLE_ENVIRONMENT,
      token: PADDLE_CLIENT_TOKEN,
      eventCallback: handleEvent,
    })
      .then((instance) => {
        if (cancelled || !instance) return;
        paddleRef.current = instance;
      })
      .catch(() => {
        if (!cancelled) setInitFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, ptxn]);

  if (!hasConfig || initFailed) {
    return (
      <Flex vertical align="center" justify="center" className="h-full w-full" gap="middle">
        <Typography.Text type="danger">{t('badges.checkoutError')}</Typography.Text>
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
      <Spin size="large" />
      <Typography.Text>{t('badges.paymentVerifying')}</Typography.Text>
    </Flex>
  );
};

export default PaymentCheckoutPage;
