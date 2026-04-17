import { type FC, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BADGES } from '@regionify/shared';
import { Flex, Typography } from 'antd';
import { useBillingBadges } from '@/hooks/useBillingBadges';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import BadgeCard from '@/components/billing/BadgeCard';
import type { PayableBadge } from '@/components/billing/types';

export const BadgesSection: FC = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const billingBadges = useBillingBadges();

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
        <Flex vertical gap="large">
          <Flex vertical gap="small" align="center" className="text-center">
            <Typography.Title
              level={2}
              className="text-primary mb-0! text-2xl font-bold md:text-3xl"
              data-i18n-key="badges.title"
            >
              {t('badges.title')}
            </Typography.Title>
            <Typography.Paragraph className="mb-0! text-gray-500" data-i18n-key="badges.subtitle">
              {t('badges.subtitle')}
            </Typography.Paragraph>
          </Flex>
          <ul className="m-0 flex w-full list-none flex-wrap items-stretch! justify-center gap-6 p-0 lg:items-start">
            {billingBadges.map((tier) => (
              <li key={tier.id} className="w-full md:w-80 md:shrink-0">
                <BadgeCard
                  tier={tier}
                  currentBadge={currentBadge}
                  onUpgrade={onUpgrade}
                  upgradingBadge={null}
                />
              </li>
            ))}
          </ul>
        </Flex>
      </div>
    </section>
  );
};
