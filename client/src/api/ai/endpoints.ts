const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const AI_ENDPOINTS = {
  parse: `${BASE_URL}/ai/parse`,
  generate: `${BASE_URL}/ai/generate`,
  remaining: `${BASE_URL}/ai/remaining`,
} as const;
