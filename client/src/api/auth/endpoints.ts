const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const AUTH_ENDPOINTS = {
  login: `${BASE_URL}/auth/login`,
  register: `${BASE_URL}/auth/register`,
  logout: `${BASE_URL}/auth/logout`,
  me: `${BASE_URL}/auth/me`,
  profile: `${BASE_URL}/auth/profile`,
  changePassword: `${BASE_URL}/auth/change-password`,
  forgotPassword: `${BASE_URL}/auth/forgot-password`,
  resetPassword: `${BASE_URL}/auth/reset-password`,
  verifyEmail: `${BASE_URL}/auth/verify-email`,
  resendVerificationEmail: `${BASE_URL}/auth/resend-verification-email`,
  deleteAccount: `${BASE_URL}/auth/account`,
  google: `${BASE_URL}/auth/google`,
} as const;
