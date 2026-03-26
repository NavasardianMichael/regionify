import { type FC, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Plan, PLANS } from '@regionify/shared';
import { Flex, Typography } from 'antd';
import { createCheckout } from '@/api/payments';
import { selectIsLoggedIn, selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { useBillingPlans } from '@/hooks/useBillingPlans';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import PlanCard from '@/components/billing/PlanCard';
import type { PayablePlan } from '@/components/billing/types';
import { useAppFeedback } from '@/components/shared/useAppFeedback';

const BillingPage: FC = () => {
  const { message } = useAppFeedback();
  const { t } = useTypedTranslation();
  const user = useProfileStore(selectUser);
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const navigate = useNavigate();
  const currentPlan: Plan = useMemo(() => user?.plan ?? PLANS.observer, [user?.plan]);
  const [upgradingPlan, setUpgradingPlan] = useState<PayablePlan | null>(null);
  const billingPlans = useBillingPlans();

  const onUpgrade = useCallback(
    async (plan: PayablePlan) => {
      if (!isLoggedIn) {
        navigate(ROUTES.LOGIN, { replace: true });
        return;
      }
      setUpgradingPlan(plan);
      try {
        const { checkoutUrl } = await createCheckout({ plan });
        window.location.href = checkoutUrl;
      } catch {
        message.error(t('plans.checkoutError'), 0);
        setUpgradingPlan(null);
      }
    },
    [isLoggedIn, message, navigate, t],
  );

  return (
    <Flex vertical align="center" gap="large" className="mx-auto! w-full max-w-5xl">
      <Flex vertical align="center" gap="small">
        <Typography.Title level={1} className="text-primary mb-0! text-3xl font-bold">
          {t('plans.title')}
        </Typography.Title>
        <Typography.Paragraph className="mb-0! text-gray-500">
          {t('plans.subtitle')}
        </Typography.Paragraph>
      </Flex>

      <Flex gap="large" justify="center" align="stretch" wrap="wrap" className="w-full">
        {billingPlans.map((plan) => (
          <Flex key={plan.id} className="h-full w-80 max-w-full min-w-0 shrink-0" vertical>
            <PlanCard
              plan={plan}
              currentPlan={currentPlan}
              onUpgrade={onUpgrade}
              upgradingPlan={upgradingPlan}
            />
          </Flex>
        ))}
      </Flex>

      <Typography.Text type="secondary">{t('plans.paymentNote')}</Typography.Text>
    </Flex>
  );
};

export default BillingPage;
