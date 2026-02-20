import type { Plan } from '@regionify/shared';
import type { PayablePlan } from '@/constants/plans';

export type CreateCheckoutPayload = {
  plan: PayablePlan;
};

export type CreateCheckoutResponse = {
  checkoutUrl: string;
};
