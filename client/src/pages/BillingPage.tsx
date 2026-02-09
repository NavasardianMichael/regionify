import { type FC, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Flex, Typography } from 'antd';
import { createOrder } from '@/api/payments';
import { selectIsLoggedIn, selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { type Plan, PLANS } from '@regionify/shared';
import { BILLING_PLANS } from '@/components/billing/constants';
import PlanCard from '@/components/billing/PlanCard';
import type { PayablePlan } from '@/components/billing/types';

const BillingPage: FC = () => {
  const { message } = App.useApp();
  const user = useProfileStore(selectUser);
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const navigate = useNavigate();
  const currentPlan: Plan = useMemo(() => user?.plan ?? PLANS.free, [user?.plan]);
  const [upgradingPlan, setUpgradingPlan] = useState<PayablePlan | null>(null);

  const onUpgrade = useCallback(
    async (plan: PayablePlan) => {
      if (!isLoggedIn) {
        navigate('/login', { replace: true });
        return;
      }
      setUpgradingPlan(plan);
      try {
        const { approvalUrl } = await createOrder({ plan });
        window.location.href = approvalUrl;
      } catch {
        message.error('Could not start checkout. Please try again.');
        setUpgradingPlan(null);
      }
    },
    [isLoggedIn, message, navigate],
  );

  return (
    <Flex vertical align="center" gap="large" className="mx-auto! w-full max-w-5xl">
      <Flex vertical align="center" gap="small">
        <Typography.Title level={1} className="text-primary mb-0! text-3xl font-bold">
          Choose Your Plan
        </Typography.Title>
        <Typography.Paragraph className="mb-0! text-gray-500">
          Select the perfect plan for your mapping needs
        </Typography.Paragraph>
      </Flex>

      <Flex gap="large" justify="center" wrap="wrap" className="w-full">
        {BILLING_PLANS.map((plan) => (
          <Flex key={plan.id} className="w-80 shrink-0" vertical>
            <PlanCard
              plan={plan}
              currentPlan={currentPlan}
              onUpgrade={onUpgrade}
              upgradingPlan={upgradingPlan}
            />
          </Flex>
        ))}
      </Flex>

      <Typography.Text type="secondary">
        Payments are secure via PayPal. No card data is stored on our servers.
      </Typography.Text>
    </Flex>
  );
};

export default BillingPage;
