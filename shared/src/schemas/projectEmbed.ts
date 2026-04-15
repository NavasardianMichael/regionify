import { z } from 'zod';

const keywordSchema = z.string().trim().min(1).max(80);
const ALLOWED_ORIGIN_MAX_COUNT = 20;
const ALLOWED_ORIGIN_MAX_LENGTH = 200;
const ALLOWED_ORIGIN_RE = /^(https?):\/\/(?!(?:.*@))(?:[a-z0-9.-]+|\[[a-f0-9:]+\])(?::\d{1,5})?$/i;

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, '').toLowerCase();
}

function isValidAllowedOrigin(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed === '*') return true;
  return ALLOWED_ORIGIN_RE.test(trimmed.replace(/\/+$/, ''));
}

const allowedOriginSchema = z
  .string()
  .trim()
  .min(1)
  .max(ALLOWED_ORIGIN_MAX_LENGTH)
  .refine(isValidAllowedOrigin, {
    message:
      'Each allowed origin must be a valid http(s) origin (e.g. https://example.com), without path/query/hash, or use * alone to allow all origins',
  })
  .transform((v) => (v.trim() === '*' ? '*' : normalizeOrigin(v)));

const projectEmbedSeoUpdateSchema = z.object({
  title: z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().max(150).optional().nullable(),
  keywords: z.array(keywordSchema).max(5).optional().nullable(),
  allowedOrigins: z
    .array(allowedOriginSchema)
    .max(ALLOWED_ORIGIN_MAX_COUNT)
    .superRefine((arr, ctx) => {
      if (arr.includes('*') && arr.length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '* must be the only entry when allowing all origins',
        });
      }
    })
    .optional()
    .nullable(),
});

export const projectEmbedUpdateSchema = z
  .object({
    enabled: z.boolean(),
    showHeader: z.boolean().optional(),
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
