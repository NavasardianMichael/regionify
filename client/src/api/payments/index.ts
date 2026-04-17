import { PAYMENT_ENDPOINTS } from './endpoints';
import type { CreateCheckoutPayload, CreateCheckoutResponse } from './types';

type ApiResult<T> = { success: true; data: T } | { success: false; error: { message: string } };

export async function createCheckout(
  payload: CreateCheckoutPayload,
): Promise<CreateCheckoutResponse> {
  const response = await fetch(PAYMENT_ENDPOINTS.createCheckout, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ApiResult<CreateCheckoutResponse>;

  if (!response.ok || !data.success) {
    const msg =
      data && typeof data === 'object' && 'error' in data && data.error?.message
        ? data.error.message
        : 'Failed to create checkout';
    throw new Error(msg);
  }

  return data.data;
}
