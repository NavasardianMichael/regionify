import type { Badge } from '@regionify/shared';
import type { PayableBadge } from '@/constants/badges';

export type { PayableBadge };

export type BadgeFeature = {
  text: string;
  included: boolean;
};

export type BillingBadge = {
  id: Badge;
  name: string;
  description: string;
  price: number;
  period: 'lifetime';
  popular: boolean;
  buttonText: string;
  features: BadgeFeature[];
};
