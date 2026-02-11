/**
 * User subscription plan. Enum lives in backend (Prisma); this type is the public contract.
 */

export const PLANS = {
  observer: 'observer',
  explorer: 'explorer',
  chronographer: 'chronographer',
} as const;

export type Plan = (typeof PLANS)[keyof typeof PLANS];
// Observer (free) → Explorer → Cartographer → Chronographer
