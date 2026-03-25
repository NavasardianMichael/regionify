import { z } from 'zod';

const keywordSchema = z.string().trim().min(1).max(80);

export const projectEmbedUpdateSchema = z
  .object({
    enabled: z.boolean(),
    seoTitle: z.string().trim().max(200).optional().nullable(),
    seoDescription: z.string().trim().max(150).optional().nullable(),
    seoKeywords: z.array(keywordSchema).max(5).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.enabled) return;
    const title = data.seoTitle?.trim() ?? '';
    if (title.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page title is required when public embed is enabled',
        path: ['seoTitle'],
      });
    }
    const description = data.seoDescription?.trim() ?? '';
    if (description.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Meta description is required when public embed is enabled',
        path: ['seoDescription'],
      });
    }
  });

export type ProjectEmbedUpdateInput = z.infer<typeof projectEmbedUpdateSchema>;
