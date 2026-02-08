import type {
  CapturePayload,
  CaptureResponse,
  CreateOrderPayload,
  CreateOrderResponse,
} from './types';
import { PAYMENT_ENDPOINTS } from './endpoints';

type ApiResult<T> = { success: true; data: T } | { success: false; error: { message: string } };

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  const response = await fetch(PAYMENT_ENDPOINTS.createOrder, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ApiResult<CreateOrderResponse>;

  if (!response.ok || !data.success) {
    const msg =
      data && typeof data === 'object' && 'error' in data && data.error?.message
        ? data.error.message
        : 'Failed to create order';
    throw new Error(msg);
  }

  return data.data;
}

export async function captureOrder(payload: CapturePayload): Promise<CaptureResponse> {
  const response = await fetch(PAYMENT_ENDPOINTS.capture, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ApiResult<CaptureResponse>;

  if (!response.ok || !data.success) {
    const msg =
      data && typeof data === 'object' && 'error' in data && data.error?.message
        ? data.error.message
        : 'Failed to capture payment';
    throw new Error(msg);
  }

  return data.data;
}
