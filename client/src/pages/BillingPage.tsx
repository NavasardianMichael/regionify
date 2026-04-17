import { type FC, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Badge, BADGES } from '@regionify/shared';
import { createCheckout } from '@/api/payments';
import { selectIsLoggedIn, selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import BadgesSection from '@/components/billing/BadgesSection';
import type { PayableBadge } from '@/components/billing/types';
import { useAppFeedback } from '@/components/shared/useAppFeedback';

const BillingPage: FC = () => {
  const { message } = useAppFeedback();
  const { t } = useTypedTranslation();
  const user = useProfileStore(selectUser);
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const navigate = useNavigate();
  const currentBadge: Badge = useMemo(() => user?.badge ?? BADGES.observer, [user?.badge]);
  const [upgradingBadge, setUpgradingBadge] = useState<PayableBadge | null>(null);

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
      <BadgesSection
        currentBadge={currentBadge}
        onUpgrade={onUpgrade}
        upgradingBadge={upgradingBadge}
        variant="billing"
      />
    </div>
  );
};

export default BillingPage;
