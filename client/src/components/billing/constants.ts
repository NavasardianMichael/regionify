import { PLAN_DETAILS, PLANS } from '@regionify/shared';

/** Billing UI metadata. Feature rows are built from `PLAN_DETAILS` in `useBillingPlans`. */
export const BILLING_PLAN_DEFINITIONS = [
  {
    id: PLANS.observer,
    planLocaleKey: 'observer' as const,
    price: PLAN_DETAILS.observer.price,
    popular: false as const,
  },
  {
    id: PLANS.explorer,
    planLocaleKey: 'explorer' as const,
    price: PLAN_DETAILS.explorer.price,
    popular: false as const,
  },
  {
    id: PLANS.chronographer,
    planLocaleKey: 'chronographer' as const,
    price: PLAN_DETAILS.chronographer.price,
    popular: true as const,
  },
] as const;
