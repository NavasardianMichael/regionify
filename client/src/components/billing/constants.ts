import { BADGE_DETAILS, BADGES } from '@regionify/shared';

/** Billing UI metadata. Feature rows are built from `BADGE_DETAILS` in `useBillingBadges`. */
export const BILLING_BADGE_DEFINITIONS = [
  {
    id: BADGES.observer,
    badgeLocaleKey: 'observer' as const,
    price: BADGE_DETAILS.observer.price,
    popular: false,
  },
  {
    id: BADGES.explorer,
    badgeLocaleKey: 'explorer' as const,
    price: BADGE_DETAILS.explorer.price,
    popular: true,
  },
  {
    id: BADGES.chronographer,
    badgeLocaleKey: 'chronographer' as const,
    price: BADGE_DETAILS.chronographer.price,
    popular: false,
  },
] as const;
