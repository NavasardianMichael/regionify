import {
  type Badge,
  BADGE_DETAILS,
  type BadgeDetails,
  BADGES,
  formatBadgePriceUsd,
} from '@regionify/shared';

/** Cheapest first. Each tier includes the previous tier's capabilities. */
const TIER_ORDER: readonly Badge[] = [BADGES.observer, BADGES.explorer, BADGES.chronographer];

type BadgeLimits = BadgeDetails['limits'];

/**
 * The cheapest tier whose limits satisfy `predicate` — so guide copy never hardcodes which
 * badge gates a feature. Throws at build time rather than shipping a wrong tier claim.
 */
export function lowestBadgeWhere(predicate: (limits: BadgeLimits) => boolean): Badge {
  const badge = TIER_ORDER.find((candidate) => predicate(BADGE_DETAILS[candidate].limits));
  if (!badge) {
    throw new Error(
      'lowestBadgeWhere: no badge satisfies the predicate — a guide claims a feature that no tier provides.',
    );
  }
  return badge;
}

/** `observer` -> `Observer`. */
export function badgeName(badge: Badge): string {
  return `${badge.charAt(0).toUpperCase()}${badge.slice(1)}`;
}

/** `Chronographer ($39, one-time)` / `Observer (free)`. */
export function badgeLabel(badge: Badge): string {
  if (BADGE_DETAILS[badge].price === 0) return `${badgeName(badge)} (free)`;
  return `${badgeName(badge)} (${formatBadgePriceUsd(badge)}, one-time)`;
}

/** Tier that first unlocks the public embed / iframe. */
export function embedBadgeLabel(): string {
  return badgeLabel(lowestBadgeWhere((limits) => limits.publicEmbed));
}

/** Tier that first unlocks GIF/MP4 timeline export. */
export function animationBadgeLabel(): string {
  return badgeLabel(lowestBadgeWhere((limits) => limits.animationExport));
}

/** Tier that first unlocks watermark-free export. */
export function watermarkFreeBadgeLabel(): string {
  return badgeLabel(lowestBadgeWhere((limits) => limits.watermarkFree));
}
