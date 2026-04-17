import { type FC, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BADGES } from '@regionify/shared';
import { ROUTES } from '@/constants/routes';
import BadgesSectionShared from '@/components/billing/BadgesSection';
import type { PayableBadge } from '@/components/billing/types';

export const BadgesSection: FC = () => {
  const navigate = useNavigate();

  const currentBadge = useMemo(() => BADGES.observer, []);

  const onUpgrade = useCallback(
    (_badge: PayableBadge) => {
      void navigate(ROUTES.BILLING);
    },
    [navigate],
  );

  return (
    <section className="bg-white px-6 py-16 md:py-20">
      <div className="mx-auto w-full max-w-5xl">
        <BadgesSectionShared
          currentBadge={currentBadge}
          onUpgrade={onUpgrade}
          upgradingBadge={null}
          variant="home"
        />
      </div>
    </section>
  );
};
