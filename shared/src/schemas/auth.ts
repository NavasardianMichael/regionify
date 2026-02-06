import { z } from 'zod';

import { AUTH_VALIDATION } from '../constants/validation.js';

const { email, password, name, token } = AUTH_VALIDATION;

// Password requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number
const passwordSchema = z
  .string()
  .min(password.minLength, password.messages.minLength)
  .max(password.maxLength, password.messages.maxLength)
  .regex(password.patterns.lowercase, password.messages.lowercase)
  .regex(password.patterns.uppercase, password.messages.uppercase)
  .regex(password.patterns.number, password.messages.number);

export const loginSchema = z.object({
  email: z.string().email(email.messages.invalid).max(email.maxLength),
  password: z.string().min(1, password.messages.required).max(password.maxLength),
});

export const registerSchema = z.object({
  email: z.string().email(email.messages.invalid).max(email.maxLength),
  password: passwordSchema,
  name: z
    .string()
    .min(name.minLength, name.messages.minLength)
    .max(name.maxLength, name.messages.maxLength)
    .regex(name.pattern, name.messages.pattern),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(email.messages.invalid).max(email.maxLength),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, token.messages.required),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, password.messages.required),
  newPassword: passwordSchema,
});

// Type inference from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
