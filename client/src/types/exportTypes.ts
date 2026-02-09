import { EXPORT_TYPES } from '../constants/exportTypes';

export type ExportType = (typeof EXPORT_TYPES)[keyof typeof EXPORT_TYPES];
