export { BADGES } from '@regionify/shared';
import type { Badge, BADGES } from '@regionify/shared';

export type PayableBadge = Exclude<Badge, typeof BADGES.observer>;
