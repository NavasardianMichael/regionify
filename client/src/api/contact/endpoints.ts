const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const CONTACT_ENDPOINTS = {
  send: `${BASE_URL}/contact`,
} as const;
