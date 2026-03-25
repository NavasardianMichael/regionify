import { EMBED_ENDPOINTS } from './endpoints';
import type { PublicEmbedApiResponse } from './types';

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

type ApiErrorResponse = {
  error?: { message?: string };
};

export const fetchPublicEmbedData = async (token: string): Promise<PublicEmbedApiResponse> => {
  const response = await fetch(EMBED_ENDPOINTS.data(token), {
    method: 'GET',
    credentials: 'omit',
  });

  const data = (await response.json()) as ApiResponse<PublicEmbedApiResponse> | ApiErrorResponse;

  if (!response.ok || !('success' in data) || !data.success) {
    const msg =
      typeof data === 'object' && data !== null && 'error' in data
        ? (data as ApiErrorResponse).error?.message
        : undefined;
    throw new Error(msg ?? 'Failed to load embed');
  }

  return (data as ApiResponse<PublicEmbedApiResponse>).data;
};
