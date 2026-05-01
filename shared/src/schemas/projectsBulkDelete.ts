import { z } from 'zod';

import { PROJECTS_BULK_DELETE_MAX_IDS } from '../constants/projects.js';

export const projectsBulkDeleteSchema = z.object({
  ids: z
    .array(z.string().uuid())
    .min(1)
    .max(PROJECTS_BULK_DELETE_MAX_IDS)
    .transform((ids) => [...new Set(ids)]),
});

export type ProjectsBulkDeleteInput = z.infer<typeof projectsBulkDeleteSchema>;
