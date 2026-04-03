import { useMemo } from 'react';
import { EXPORT_TYPES, type ExportType, type Plan, PLAN_DETAILS } from '@regionify/shared';
import { type TypedT, useTypedTranslation } from '@/i18n/useTypedTranslation';
import { BILLING_PLAN_DEFINITIONS } from '@/components/billing/constants';
import type { BillingPlan } from '@/components/billing/types';

const STILL_IMAGE_EXPORTS: ReadonlySet<ExportType> = new Set([
  EXPORT_TYPES.png,
  EXPORT_TYPES.svg,
  EXPORT_TYPES.jpeg,
]);

function formatStillImageFormats(planId: Plan): string {
  const formats = PLAN_DETAILS[planId].limits.allowedExportFormats.filter((x) =>
    STILL_IMAGE_EXPORTS.has(x),
  );
  return formats.map((x) => x.toUpperCase()).join(', ');
}

function buildPlanFeatures(planId: Plan, t: TypedT): BillingPlan['features'] {
  const l = PLAN_DETAILS[planId].limits;

  const projectText =
    l.maxProjectsCount === null
      ? t('plans.rows.projectsUnlimited')
      : t('plans.rows.projectsLimited', { count: l.maxProjectsCount });

  const sessionsText =
    l.maxConcurrentSessions === null
      ? null
      : t('plans.rows.sessionsLimited', { count: l.maxConcurrentSessions });

  const imageExportText = t('plans.rows.imageExport', {
    formats: formatStillImageFormats(planId),
    quality: l.maxExportQuality,
  });

  const watermarkText = l.advancedStylesEnabled
    ? t('plans.rows.noWatermark')
    : t('plans.rows.watermark');

  const rows: BillingPlan['features'] = [
    { text: projectText, included: true },
    ...(sessionsText ? [{ text: sessionsText, included: true }] : []),
    { text: imageExportText, included: true },
    { text: t('plans.rows.advancedStyles'), included: true },
    { text: watermarkText, included: true },
    { text: t('plans.rows.timeSeries'), included: l.historicalDataImport },
    { text: t('plans.rows.animationExport'), included: l.animationExport },
    { text: t('plans.rows.embedMapIframe'), included: l.publicEmbed },
    { text: t('plans.rows.publicMapPage'), included: l.publicEmbed },
  ];
  /** Only show capabilities this plan actually includes (no gray “not included” filler rows). */
  return rows.filter((row) => row.included);
}

export function useBillingPlans(): BillingPlan[] {
  const { t } = useTypedTranslation();

  return useMemo(
    () =>
      BILLING_PLAN_DEFINITIONS.map((def) => {
        const base = `plans.items.${def.planLocaleKey}` as const;
        return {
          id: def.id,
          name: t(`${base}.name`),
          price: def.price,
          period: 'lifetime',
          description: t(`${base}.description`),
          features: buildPlanFeatures(def.id, t),
          popular: def.popular,
          buttonText: t(`${base}.buttonText`),
        };
      }),
    [t],
  );
}
