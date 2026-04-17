/**
 * User subscription badge (tier). Enum lives in backend (Prisma); this type is the public contract.
 */

export const BADGES = {
  observer: 'observer',
  explorer: 'explorer',
  chronographer: 'chronographer',
} as const;

export type Badge = (typeof BADGES)[keyof typeof BADGES];
