import { z } from 'zod';

export const contactSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be at most 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be at most 100 characters'),
  email: z.string().email('Invalid email address').max(255),
  body: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be at most 5000 characters'),
  subject: z.string().max(200, 'Subject must be at most 200 characters').optional(),
  phoneNumber: z.string().max(20, 'Phone number must be at most 20 characters').optional(),
  details: z.record(z.string(), z.string()).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
