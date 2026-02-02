import type { IMPORT_DATA_TYPES } from '@/constants/data';
import type { REGION_IDS } from '@/constants/regions';

export type ImportDataType = (typeof IMPORT_DATA_TYPES)[keyof typeof IMPORT_DATA_TYPES];

export type RegionId = (typeof REGION_IDS)[keyof typeof REGION_IDS];
