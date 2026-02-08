/**
 * User subscription plan. Enum lives in backend (Prisma); this type is the public contract.
 */
export type Plan = 'free' | 'explorer' | 'atlas';

export const PLANS: Record<Plan, Plan> = {
  free: 'free',
  explorer: 'explorer',
  atlas: 'atlas',
} as const;
