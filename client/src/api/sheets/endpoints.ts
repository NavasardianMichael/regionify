const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const SHEETS_ENDPOINTS = {
  fetch: `${BASE_URL}/sheets/fetch`,
} as const;
