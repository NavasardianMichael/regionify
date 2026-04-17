import type { PayableBadge } from '@/constants/badges';

export type CreateCheckoutPayload = {
  badge: PayableBadge;
};

export type CreateCheckoutResponse = {
  checkoutUrl: string;
};
