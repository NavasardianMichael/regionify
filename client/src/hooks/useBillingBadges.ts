import { useMemo } from 'react';
import { type Badge, buildBadgeFeatureRows } from '@regionify/shared';
import { type TypedT, useTypedTranslation } from '@/i18n/useTypedTranslation';
import { BILLING_BADGE_DEFINITIONS } from '@/components/billing/constants';
import type { BillingBadge } from '@/components/billing/types';

function buildBadgeFeatures(badgeId: Badge, t: TypedT): BillingBadge['features'] {
  return buildBadgeFeatureRows(badgeId)
    .filter((row) => row.included)
    .map((row) => ({
      text: t(`badges.rows.${row.key}`, row.params),
      included: true,
    }));
}

export function useBillingBadges(): BillingBadge[] {
  const { t } = useTypedTranslation();

  return useMemo(
    () =>
      BILLING_BADGE_DEFINITIONS.map((def) => {
        const base = `badges.items.${def.badgeLocaleKey}` as const;
        return {
          id: def.id,
          name: t(`${base}.name`),
          price: def.price,
          period: 'lifetime',
          description: t(`${base}.description`),
          features: buildBadgeFeatures(def.id, t),
          popular: def.popular,
          buttonText: t(`${base}.buttonText`),
        };
      }),
    [t],
  );
}
