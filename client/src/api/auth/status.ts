import type { UserPublic } from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

type AuthStatusResponse = {
  success: boolean;
  data: {
    authenticated: boolean;
    user: UserPublic | null;
  };
};

export const getAuthStatus = async (): Promise<AuthStatusResponse['data']> => {
  const response = await fetch(`${BASE_URL}/auth/status`, {
    credentials: 'include',
  });

  const data = (await response.json()) as AuthStatusResponse;

  if (!response.ok) {
    throw new Error('Failed to check auth status');
  }

  return data.data;
};
