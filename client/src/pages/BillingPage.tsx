import { type FC, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Plan, PLANS } from '@regionify/shared';
import { Typography } from 'antd';
import { createCheckout } from '@/api/payments';
import { selectIsLoggedIn, selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { useBillingPlans } from '@/hooks/useBillingPlans';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import PlanCard from '@/components/billing/PlanCard';
import type { PayablePlan } from '@/components/billing/types';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { AppNavLink } from '@/components/ui/AppNavLink';

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
        message.error(t('plans.checkoutError'));
        setUpgradingPlan(null);
      }
    },
    [isLoggedIn, message, navigate, t],
  );

  return (
    <div className="m-auto w-full max-w-5xl shrink-0">
      <header className="mb-8 flex flex-col items-center gap-2 text-center">
        <Typography.Title
          level={1}
          className="text-primary mb-0! w-full text-3xl font-bold"
          data-i18n-key="plans.title"
        >
          {t('plans.title')}
        </Typography.Title>
        <Typography.Paragraph
          className="mb-0! w-full max-w-3xl text-center text-gray-500"
          data-i18n-key="plans.subtitle"
        >
          {t('plans.subtitle')}
        </Typography.Paragraph>
      </header>

      <ul className="m-0 flex w-full min-w-0 list-none flex-wrap items-stretch! justify-center gap-8 p-0 md:gap-6 lg:items-start">
        {billingPlans.map((plan) => (
          <li key={plan.id} className="w-full flex-col md:w-80 md:shrink-0">
            <PlanCard
              plan={plan}
              currentPlan={currentPlan}
              onUpgrade={onUpgrade}
              upgradingPlan={upgradingPlan}
            />
          </li>
        ))}
      </ul>

      <Typography.Text
        type="secondary"
        className="relative z-10 mt-10 block w-full px-1 text-center text-sm lg:text-base"
        data-i18n-key="plans.paymentNote"
      >
        {t('plans.paymentNote')}
      </Typography.Text>
      <Typography.Text
        type="secondary"
        className="relative z-10 block w-full px-1 text-center text-sm lg:text-base"
        data-i18n-key="plans.paymentIssueNote"
      >
        {t('plans.paymentIssueNote')}{' '}
        <AppNavLink
          className="font-semibold underline!"
          to={ROUTES.CONTACT}
          data-i18n-key="plans.paymentContactUs"
        >
          {t('plans.paymentContactUs')}
        </AppNavLink>
        .
      </Typography.Text>
    </div>
  );
};

export default BillingPage;
