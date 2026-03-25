const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const EMBED_ENDPOINTS = {
  data: (token: string) => `${BASE_URL}/embed-data/${encodeURIComponent(token)}`,
} as const;
