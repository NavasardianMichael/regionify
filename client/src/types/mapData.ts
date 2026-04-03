import type { REGION_IDS } from '@/constants/regions';

export type { ImportDataType } from '@/constants/data';

export type RegionId = (typeof REGION_IDS)[keyof typeof REGION_IDS];
export type CountryId = RegionId;
