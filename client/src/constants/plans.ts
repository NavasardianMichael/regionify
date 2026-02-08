export { PLAN_FEATURE_LIMITS, type PlanFeatureLimits, type ExportFormat } from '@regionify/shared';
export type { Plan } from '@regionify/shared';

/** Plan that can be purchased (excludes free). Use for upgrade flows and API payloads. */
export type PayablePlan = Exclude<Plan, 'free'>;
