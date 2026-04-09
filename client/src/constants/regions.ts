import {
  REGION_IDS as REGION_IDS_BASE,
  REGION_OPTIONS as REGION_OPTIONS_BASE,
  type RegionMapOption,
} from '@regionify/shared';
import type { DefaultOptionType } from 'antd/es/select';

export { REGION_IDS_BASE as REGION_IDS, type RegionMapOption };

/** Ant Design `Select` options; values match `@regionify/shared` region ids. */
export const REGION_OPTIONS = REGION_OPTIONS_BASE as unknown as DefaultOptionType[];
