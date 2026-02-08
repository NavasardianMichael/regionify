import type { PayablePlan } from '@/constants/plans';

export type CreateOrderPayload = {
  plan: PayablePlan;
};

export type CreateOrderResponse = {
  orderId: string;
  approvalUrl: string;
};

export type CapturePayload = {
  orderId: string;
};

export type CaptureResponse = {
  plan: 'free' | 'explorer' | 'atlas';
};
