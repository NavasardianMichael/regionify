import type { IMPORT_DATA_TYPES } from '@/constants/data';
import type { JURISDICTION_IDS } from '@/constants/jurisdictions';

export type ImportDataType = (typeof IMPORT_DATA_TYPES)[keyof typeof IMPORT_DATA_TYPES];

export type JurisdictionId = (typeof JURISDICTION_IDS)[keyof typeof JURISDICTION_IDS];
