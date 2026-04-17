import { type Badge, BADGES } from '@regionify/shared';

/** Ant Design `Badge.Ribbon` color for paid tiers; Observer uses brand primary. */
export const BADGE_RIBBON_PRIMARY_HEX = '#18294D';

export function badgeRibbonColor(badge: Badge): string {
  if (badge === BADGES.explorer) return 'cyan';
  if (badge === BADGES.chronographer) return 'volcano';
  return BADGE_RIBBON_PRIMARY_HEX;
}

export type BadgeRibbonNameKey =
  | 'badges.items.observer.name'
  | 'badges.items.explorer.name'
  | 'badges.items.chronographer.name';

export function badgeRibbonNameKey(badge: Badge): BadgeRibbonNameKey {
  if (badge === BADGES.explorer) return 'badges.items.explorer.name';
  if (badge === BADGES.chronographer) return 'badges.items.chronographer.name';
  return 'badges.items.observer.name';
}
