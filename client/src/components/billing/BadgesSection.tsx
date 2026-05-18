import { type FC, useMemo } from 'react';
import { type Badge } from '@regionify/shared';
import { Button, Flex, Typography } from 'antd';
import { useBillingBadges } from '@/hooks/useBillingBadges';
import { usePricingPreview } from '@/hooks/usePricingPreview';
import { EXTERNAL_URLS, ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { AppNavLink } from '@/components/ui/AppNavLink';
import BadgeCard from './BadgeCard';
import type { PayableBadge } from './types';

type PaymentSecurityNoteProps = {
  className?: string;
};

const PaymentSecurityNote: FC<PaymentSecurityNoteProps> = ({ className }) => {
  const { t } = useTypedTranslation();
  return (
    <Typography.Text
      type="secondary"
      className={`relative z-10 block w-full px-1 text-center text-sm lg:text-base${className ? ` ${className}` : ''}`}
    >
      {t('badges.secureCheckoutPrefix')}{' '}
      <AppNavLink
        to={EXTERNAL_URLS.PADDLE}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold underline!"
      >
        Paddle
      </AppNavLink>{' '}
      {t('badges.secureCheckoutDetails')}
    </Typography.Text>
  );
};

const SECTION_VARIANTS = {
  home: {
    titleLevel: 2 as const,
    titleClassName: 'text-primary mb-0! text-2xl font-bold md:text-3xl',
    subtitleClassName: 'mb-0! text-gray-500',
    listClassName:
      'm-0 flex w-full list-none flex-wrap items-stretch! justify-center gap-6 p-0 lg:items-start',
    itemClassName: 'w-full md:w-80 md:shrink-0',
    listGap: 'large' as const,
    hideButtons: true,
    showUpgradeLink: true,
    showPaymentNotes: false,
  },
  billing: {
    titleLevel: 1 as const,
    titleClassName: 'text-primary mb-0! w-full text-3xl font-bold',
    subtitleClassName: 'mb-0! w-full max-w-3xl text-center text-gray-500',
    listClassName:
      'm-0 flex w-full min-w-0 list-none flex-wrap items-stretch! justify-center gap-8 p-0 md:gap-6 lg:items-start',
    itemClassName: 'w-full flex-col md:w-80 md:shrink-0',
    listGap: 'middle' as const,
    hideButtons: false,
    showUpgradeLink: false,
    showPaymentNotes: true,
  },
};

export type BadgesSectionProps = {
  currentBadge: Badge;
  onUpgrade: (badge: PayableBadge) => void;
  upgradingBadge: PayableBadge | null;
  variant: keyof typeof SECTION_VARIANTS;
};

const BadgesSection: FC<BadgesSectionProps> = ({
  currentBadge,
  onUpgrade,
  upgradingBadge,
  variant,
}) => {
  const { t } = useTypedTranslation();
  const billingBadges = useBillingBadges();
  const { prices, isLoading: isPricingLoading, hasError: hasPricingError } = usePricingPreview();

  const variantConfig = useMemo(() => SECTION_VARIANTS[variant], [variant]);

  return (
    <Flex vertical gap={variantConfig.listGap}>
      <Flex vertical gap="small" align="center" className="text-center">
        <Typography.Title
          level={variantConfig.titleLevel}
          className={variantConfig.titleClassName}
          data-i18n-key="badges.title"
        >
          {t('badges.title')}
        </Typography.Title>
        <Typography.Text
          className="text-primary text-sm font-semibold"
          data-i18n-key="badges.oneTimeTagline"
        >
          {t('badges.oneTimeTagline')}
        </Typography.Text>
        <Typography.Paragraph
          className={variantConfig.subtitleClassName}
          data-i18n-key="badges.subtitle"
        >
          {t('badges.subtitle')}
        </Typography.Paragraph>
      </Flex>

      <ul className={variantConfig.listClassName}>
        {billingBadges.map((tier) => (
          <li key={tier.id} className={variantConfig.itemClassName}>
            <BadgeCard
              tier={tier}
              currentBadge={currentBadge}
              onUpgrade={onUpgrade}
              upgradingBadge={upgradingBadge}
              hideButton={variantConfig.hideButtons}
              localizedPrice={
                tier.id === 'explorer'
                  ? (prices?.explorer ?? undefined)
                  : tier.id === 'chronographer'
                    ? (prices?.chronographer ?? undefined)
                    : undefined
              }
              isPriceLoading={
                (tier.id === 'explorer' || tier.id === 'chronographer') &&
                isPricingLoading &&
                !hasPricingError
              }
              shouldShowFallbackPrice={
                tier.id !== 'explorer' && tier.id !== 'chronographer'
                  ? true
                  : hasPricingError ||
                    (!isPricingLoading &&
                      (tier.id === 'explorer'
                        ? prices?.explorer === null
                        : prices?.chronographer === null))
              }
            />
          </li>
        ))}
      </ul>

      <Flex vertical gap="small">
        {variantConfig.showUpgradeLink ? (
          <Flex vertical gap="small">
            <PaymentSecurityNote />
            <Flex justify="center">
              <Button type="link" href={ROUTES.BILLING} data-i18n-key="badges.goToBadges">
                {t('badges.goToBadges')} →
              </Button>
            </Flex>
          </Flex>
        ) : null}

        {prices !== null &&
        [prices.explorer, prices.chronographer].some((p) => p !== null && !p.startsWith('$')) ? (
          <Typography.Text type="secondary" className="text-center text-sm">
            {t('badges.localCurrencyNote')}
          </Typography.Text>
        ) : null}
      </Flex>

      {variantConfig.showPaymentNotes ? (
        <Flex vertical gap="small">
          <PaymentSecurityNote className="mt-10" />
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
        </Flex>
      ) : null}
    </Flex>
  );
};

export default BadgesSection;
