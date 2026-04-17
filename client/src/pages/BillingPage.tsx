import { type FC, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Badge, BADGES } from '@regionify/shared';
import { Typography } from 'antd';
import { createCheckout } from '@/api/payments';
import { selectIsLoggedIn, selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { useBillingBadges } from '@/hooks/useBillingBadges';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import BadgeCard from '@/components/billing/BadgeCard';
import type { PayableBadge } from '@/components/billing/types';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { AppNavLink } from '@/components/ui/AppNavLink';

const BillingPage: FC = () => {
  const { message } = useAppFeedback();
  const { t } = useTypedTranslation();
  const user = useProfileStore(selectUser);
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const navigate = useNavigate();
  const currentBadge: Badge = useMemo(() => user?.badge ?? BADGES.observer, [user?.badge]);
  const [upgradingBadge, setUpgradingBadge] = useState<PayableBadge | null>(null);
  const billingBadges = useBillingBadges();

  const onUpgrade = useCallback(
    async (badge: PayableBadge) => {
      if (!isLoggedIn) {
        navigate(ROUTES.LOGIN, { replace: true });
        return;
      }
      setUpgradingBadge(badge);
      try {
        const { checkoutUrl } = await createCheckout({ badge });
        window.location.href = checkoutUrl;
      } catch {
        message.error(t('badges.checkoutError'));
        setUpgradingBadge(null);
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
          data-i18n-key="badges.title"
        >
          {t('badges.title')}
        </Typography.Title>
        <Typography.Paragraph
          className="mb-0! w-full max-w-3xl text-center text-gray-500"
          data-i18n-key="badges.subtitle"
        >
          {t('badges.subtitle')}
        </Typography.Paragraph>
      </header>

      <ul className="m-0 flex w-full min-w-0 list-none flex-wrap items-stretch! justify-center gap-8 p-0 md:gap-6 lg:items-start">
        {billingBadges.map((tier) => (
          <li key={tier.id} className="w-full flex-col md:w-80 md:shrink-0">
            <BadgeCard
              tier={tier}
              currentBadge={currentBadge}
              onUpgrade={onUpgrade}
              upgradingBadge={upgradingBadge}
            />
          </li>
        ))}
      </ul>

      <Typography.Text
        type="secondary"
        className="relative z-10 mt-10 block w-full px-1 text-center text-sm lg:text-base"
        data-i18n-key="badges.paymentNote"
      >
        {t('badges.paymentNote')}
      </Typography.Text>
      <Typography.Text
        type="secondary"
        className="relative z-10 block w-full px-1 text-center text-sm lg:text-base"
        data-i18n-key="badges.paymentIssueNote"
      >
        {t('badges.paymentIssueNote')}{' '}
        <AppNavLink
          className="font-semibold underline!"
          to={ROUTES.CONTACT}
          data-i18n-key="badges.paymentContactUs"
        >
          {t('badges.paymentContactUs')}
        </AppNavLink>
        .
      </Typography.Text>
    </div>
  );
};

export default BillingPage;
