export { PLANS } from '@regionify/shared';
import type { Plan } from '@regionify/shared';

export type { Plan } from '@regionify/shared';

/** Plan that can be purchased (excludes free). Use for upgrade flows and API payloads. */
export type PayablePlan = Exclude<Plan, 'free'>;
