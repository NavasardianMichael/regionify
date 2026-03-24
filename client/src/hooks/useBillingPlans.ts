import { useMemo } from 'react';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { BILLING_PLAN_DEFINITIONS } from '@/components/billing/constants';
import type { BillingPlan } from '@/components/billing/types';

function planFeaturesFromLocale(
  features: unknown,
  included: readonly boolean[],
): BillingPlan['features'] {
  if (!Array.isArray(features)) return [];
  return included.map((isIncluded, index) => ({
    text: String(features[index] ?? ''),
    included: isIncluded,
  }));
}

export function useBillingPlans(): BillingPlan[] {
  const { t } = useTypedTranslation();

  return useMemo(
    () =>
      BILLING_PLAN_DEFINITIONS.map((def) => {
        const base = `plans.items.${def.planLocaleKey}` as const;
        const featuresRaw = t(`${base}.features`, { returnObjects: true });
        return {
          id: def.id,
          name: t(`${base}.name`),
          price: def.price,
          period: 'lifetime',
          description: t(`${base}.description`),
          features: planFeaturesFromLocale(featuresRaw, def.included),
          popular: def.popular,
          buttonText: t(`${base}.buttonText`),
        };
      }),
    [t],
  );
}
