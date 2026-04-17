const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const AI_ENDPOINTS = {
  parse: `${BASE_URL}/ai/parse`,
  remaining: `${BASE_URL}/ai/remaining`,
} as const;
