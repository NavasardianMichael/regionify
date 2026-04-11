import { type FC, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLANS } from '@regionify/shared';
import { Flex, Typography } from 'antd';
import { useBillingPlans } from '@/hooks/useBillingPlans';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import PlanCard from '@/components/billing/PlanCard';
import type { PayablePlan } from '@/components/billing/types';

export const PlansSection: FC = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const billingPlans = useBillingPlans();

  const currentPlan = useMemo(() => PLANS.observer, []);

  const onUpgrade = useCallback(
    (_plan: PayablePlan) => {
      void navigate(ROUTES.BILLING);
    },
    [navigate],
  );

  return (
    <section className="bg-white px-6 py-16 md:py-20">
      <div className="mx-auto w-full max-w-5xl">
        <Flex vertical gap="large">
          <Flex vertical gap="small" align="center" className="text-center">
            <Typography.Title
              level={2}
              className="text-primary mb-0! text-2xl font-bold md:text-3xl"
            >
              {t('plans.title')}
            </Typography.Title>
            <Typography.Paragraph className="mb-0! text-gray-500">
              {t('plans.subtitle')}
            </Typography.Paragraph>
          </Flex>
          <ul className="m-0 flex w-full list-none flex-wrap items-stretch! justify-center gap-6 p-0 lg:items-start">
            {billingPlans.map((plan) => (
              <li key={plan.id} className="w-full md:w-80 md:shrink-0">
                <PlanCard
                  plan={plan}
                  currentPlan={currentPlan}
                  onUpgrade={onUpgrade}
                  upgradingPlan={null}
                />
              </li>
            ))}
          </ul>
        </Flex>
      </div>
    </section>
  );
};
