export { PLANS } from '@regionify/shared';
import type { Plan, PLANS } from '@regionify/shared';

export type PayablePlan = Exclude<Plan, typeof PLANS.observer>;
