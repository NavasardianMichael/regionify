const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const AUTH_ENDPOINTS = {
  login: `${BASE_URL}/auth/login`,
  register: `${BASE_URL}/auth/register`,
  logout: `${BASE_URL}/auth/logout`,
  forgotPassword: `${BASE_URL}/auth/forgot-password`,
  resetPassword: `${BASE_URL}/auth/reset-password`,
  deleteAccount: `${BASE_URL}/auth/account`,
  google: `${BASE_URL}/auth/google`,
} as const;
