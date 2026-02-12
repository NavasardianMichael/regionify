import type { Plan } from '@regionify/shared';
import type { PayablePlan } from '@/constants/plans';

export type { PayablePlan };

export type PlanFeature = {
  text: string;
  included: boolean;
};

export type BillingPlan = {
  id: Plan;
  name: string;
  price: number;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  buttonText: string;
};
