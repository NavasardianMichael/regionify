import type { LEGEND_POSITIONS } from '@/constants/legendStyles';

export type LegendPosition = (typeof LEGEND_POSITIONS)[keyof typeof LEGEND_POSITIONS];
