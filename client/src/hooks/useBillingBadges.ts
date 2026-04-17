import { useMemo } from 'react';
import { type Badge, BADGE_DETAILS, EXPORT_TYPES, type ExportType } from '@regionify/shared';
import { type TypedT, useTypedTranslation } from '@/i18n/useTypedTranslation';
import { BILLING_BADGE_DEFINITIONS } from '@/components/billing/constants';
import type { BillingBadge } from '@/components/billing/types';

const STILL_IMAGE_EXPORTS: ReadonlySet<ExportType> = new Set([
  EXPORT_TYPES.png,
  EXPORT_TYPES.svg,
  EXPORT_TYPES.jpeg,
]);

function formatStillImageFormats(badgeId: Badge): string {
  const formats = BADGE_DETAILS[badgeId].limits.allowedExportFormats.filter((x) =>
    STILL_IMAGE_EXPORTS.has(x),
  );
  return formats.map((x) => x.toUpperCase()).join(', ');
}

function buildBadgeFeatures(badgeId: Badge, t: TypedT): BillingBadge['features'] {
  const l = BADGE_DETAILS[badgeId].limits;

  const projectText =
    l.maxProjectsCount === null
      ? t('badges.rows.projectsUnlimited')
      : t('badges.rows.projectsLimited', { count: l.maxProjectsCount });

  const sessionsText =
    l.maxConcurrentSessions === null
      ? null
      : t('badges.rows.sessionsLimited', { count: l.maxConcurrentSessions });

  const imageExportText = t('badges.rows.imageExport', {
    formats: formatStillImageFormats(badgeId),
    quality: l.maxExportQuality,
  });

  const watermarkText = l.advancedStylesEnabled
    ? t('badges.rows.noWatermark')
    : t('badges.rows.watermark');

  const rows: BillingBadge['features'] = [
    { text: projectText, included: true },
    ...(sessionsText ? [{ text: sessionsText, included: true as const }] : []),
    { text: imageExportText, included: true },
    { text: t('badges.rows.advancedStyles'), included: true },
    { text: watermarkText, included: true },
    {
      text: t('badges.rows.timeSeries'),
      included: l.historicalDataImport,
    },
    {
      text: t('badges.rows.animationExport'),
      included: l.animationExport,
    },
    {
      text: t('badges.rows.embedMapIframe'),
      included: l.publicEmbed,
    },
    {
      text: t('badges.rows.publicMapPage'),
      included: l.publicEmbed,
    },
  ];
  /** Only show capabilities this tier actually includes (no gray “not included” filler rows). */
  return rows.filter((row) => row.included);
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
