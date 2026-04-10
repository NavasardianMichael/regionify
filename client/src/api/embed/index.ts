import { ErrorCode, HttpStatus } from '@regionify/shared';
import { EMBED_ENDPOINTS } from './endpoints';
import type { PublicEmbedApiResponse } from './types';

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

type ApiErrorResponse = {
  error?: { code?: string; message?: string };
};

export class PublicEmbedNotFoundError extends Error {
  constructor() {
    super('Embed not found');
    this.name = 'PublicEmbedNotFoundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function isEmbedNotFound(response: Response, data: unknown): boolean {
  if (response.status === HttpStatus.NOT_FOUND) return true;
  if (typeof data !== 'object' || data === null || !('error' in data)) return false;
  const err = (data as ApiErrorResponse).error;
  return err?.code === ErrorCode.NOT_FOUND;
}

export const fetchPublicEmbedData = async (token: string): Promise<PublicEmbedApiResponse> => {
  const response = await fetch(EMBED_ENDPOINTS.data(token), {
    method: 'GET',
    credentials: 'omit',
  });

  const data = (await response.json()) as ApiResponse<PublicEmbedApiResponse> | ApiErrorResponse;

  if (!response.ok || !('success' in data) || !data.success) {
    if (isEmbedNotFound(response, data)) {
      throw new PublicEmbedNotFoundError();
    }
    const msg =
      typeof data === 'object' && data !== null && 'error' in data
        ? (data as ApiErrorResponse).error?.message
        : undefined;
    throw new Error(msg ?? 'Failed to load embed');
  }

  return (data as ApiResponse<PublicEmbedApiResponse>).data;
};
