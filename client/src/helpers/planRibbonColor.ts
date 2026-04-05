import { type Plan, PLANS } from '@regionify/shared';

/** Brand primary; matches Tailwind `primary` / antd theme. */
export const PLAN_RIBBON_PRIMARY_HEX = '#18294D';

/** Ant Design `Badge.Ribbon` `color` (preset name or hex). */
export function planRibbonColor(plan: Plan): string {
  if (plan === PLANS.explorer) return 'cyan';
  if (plan === PLANS.chronographer) return 'volcano';
  return PLAN_RIBBON_PRIMARY_HEX;
}

export type PlanRibbonNameKey =
  | 'plans.items.observer.name'
  | 'plans.items.explorer.name'
  | 'plans.items.chronographer.name';

export function planRibbonNameKey(plan: Plan): PlanRibbonNameKey {
  if (plan === PLANS.explorer) return 'plans.items.explorer.name';
  if (plan === PLANS.chronographer) return 'plans.items.chronographer.name';
  return 'plans.items.observer.name';
}
