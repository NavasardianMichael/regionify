import type { AuthResponse, Locale, RegisterResponse, UserPublic } from '@regionify/shared';

export type LoginPayload = {
  email: string;
  password: string;
  forceLogin?: boolean;
};

export type RegisterPayload = {
  email: string;
  password: string;
  name: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
};

export type AuthApiResponse = AuthResponse;

export type RegisterApiResponse = RegisterResponse;

export type VerifyEmailPayload = {
  token: string;
};

export type UpdateProfilePayload = {
  name?: string;
  locale?: Locale;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type AuthErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
};

export type { UserPublic };
