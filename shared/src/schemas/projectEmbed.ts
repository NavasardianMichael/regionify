import { z } from 'zod';

const keywordSchema = z.string().trim().min(1).max(80);

const projectEmbedSeoUpdateSchema = z.object({
  title: z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().max(150).optional().nullable(),
  keywords: z.array(keywordSchema).max(5).optional().nullable(),
});

export const projectEmbedUpdateSchema = z
  .object({
    enabled: z.boolean(),
    seo: projectEmbedSeoUpdateSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.enabled) return;
    const title = data.seo?.title?.trim() ?? '';
    if (title.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page title is required when public embed is enabled',
        path: ['seo', 'title'],
      });
    }
    const description = data.seo?.description?.trim() ?? '';
    if (description.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Meta description is required when public embed is enabled',
        path: ['seo', 'description'],
      });
    }
  });

export type ProjectEmbedUpdateInput = z.infer<typeof projectEmbedUpdateSchema>;
