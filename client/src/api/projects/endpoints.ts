const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const PROJECT_ENDPOINTS = {
  list: `${BASE_URL}/projects`,
  detail: (id: string) => `${BASE_URL}/projects/${id}`,
} as const;
