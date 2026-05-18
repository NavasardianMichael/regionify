import { useMemo } from 'react';
import { type Badge, BADGE_DETAILS, EXPORT_TYPES, type ExportType } from '@regionify/shared';
import { type TypedT, useTypedTranslation } from '@/i18n/useTypedTranslation';
import { BILLING_BADGE_DEFINITIONS } from '@/components/billing/constants';
import type { BillingBadge } from '@/components/billing/types';

/** Fixed display order for the billing card export line: JPEG → PNG → PDF → SVG (each only if tier allows it). GIF/MP4 stay on the animation row. */
const EXPORT_FORMAT_DISPLAY_ORDER: ReadonlyArray<{ type: ExportType; label: string }> = [
  { type: EXPORT_TYPES.jpeg, label: 'JPEG' },
  { type: EXPORT_TYPES.png, label: 'PNG' },
  { type: EXPORT_TYPES.pdf, label: 'PDF' },
  { type: EXPORT_TYPES.svg, label: 'SVG' },
];

function formatListedExportFormats(badgeId: Badge): string {
  const allowed = new Set(BADGE_DETAILS[badgeId].limits.allowedExportFormats);
  return EXPORT_FORMAT_DISPLAY_ORDER.filter(({ type }) => allowed.has(type))
    .map(({ label }) => label)
    .join(', ');
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
    formats: formatListedExportFormats(badgeId),
    quality: l.maxExportQuality,
  });

  const rows: BillingBadge['features'] = [
    { text: projectText, included: true },
    ...(sessionsText ? [{ text: sessionsText, included: true as const }] : []),
    { text: imageExportText, included: true },
    {
      text: t('badges.rows.advancedStyles'),
      included: l.advancedStylesEnabled,
    },
    // "No watermark" is a paid-tier benefit; observer's watermark limitation is conveyed
    // via the tier description, not as a checkmarked row.
    {
      text: t('badges.rows.noWatermark'),
      included: l.advancedStylesEnabled,
    },
    {
      text: t('badges.rows.highResolutionExport'),
      included: l.highResolutionExport,
    },
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
  /** Only show capabilities this tier actually includes (no gray "not included" filler rows). */
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
