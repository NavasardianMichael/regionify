import { PLAN_DETAILS, PLANS } from '@regionify/shared';

/** Structural billing data; copy comes from `plans.items.*` in locales via `useBillingPlans`. */
export const BILLING_PLAN_DEFINITIONS = [
  {
    id: PLANS.observer,
    planLocaleKey: 'observer' as const,
    price: PLAN_DETAILS.observer.price,
    popular: false as const,
    included: [true, true, true, true, false, false] as const,
  },
  {
    id: PLANS.explorer,
    planLocaleKey: 'explorer' as const,
    price: PLAN_DETAILS.explorer.price,
    popular: false as const,
    included: [true, true, true, true, true, false] as const,
  },
  {
    id: PLANS.chronographer,
    planLocaleKey: 'chronographer' as const,
    price: PLAN_DETAILS.chronographer.price,
    popular: true as const,
    included: [true, true, true] as const,
  },
] as const;
