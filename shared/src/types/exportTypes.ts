// Shared type for export types

import { EXPORT_TYPES } from '../constants/exportTypes.js';

export type ExportType = (typeof EXPORT_TYPES)[keyof typeof EXPORT_TYPES];
