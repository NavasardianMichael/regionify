import { Plan, PLANS } from '@regionify/shared';
import { HttpStatus, ErrorCode } from '@regionify/shared';

import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { userRepository } from '../repositories/userRepository.js';

/** Plan to USD amount (for PayPal purchase_units). Values can be changed. */
const PLAN_AMOUNTS: Record<Exclude<Plan, typeof PLANS.free>, string> = {
  [PLANS.explorer]: '9.99',
  [PLANS.atlas]: '19.99',
};

const PAYPAL_SANDBOX_DEFAULT = 'https://api-m.sandbox.paypal.com';

function getPayPalBaseUrl(): string {
  return env.PAYPAL_API_BASE_URL ?? PAYPAL_SANDBOX_DEFAULT;
}

async function getAccessToken(): Promise<string> {
  const clientId = env.PAYPAL_CLIENT_ID;
  const clientSecret = env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new AppError(
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.INTERNAL_ERROR,
      'PayPal is not configured',
    );
  }

  const baseUrl = getPayPalBaseUrl();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error_description?: string };
    throw new AppError(
      HttpStatus.BAD_GATEWAY,
      ErrorCode.INTERNAL_ERROR,
      err.error_description ?? 'Failed to get PayPal access token',
    );
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export type CreateOrderResult = {
  orderId: string;
  approvalUrl: string;
};

export const paymentService = {
  /**
   * Create a PayPal order for a plan upgrade. Returns orderId and URL to redirect the user.
   * Server-only; no client tokens.
   */
  async createOrder(userId: string, plan: Exclude<Plan, 'free'>): Promise<CreateOrderResult> {
    const amount = PLAN_AMOUNTS[plan];
    if (!amount) {
      throw new AppError(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, 'Invalid plan');
    }

    const token = await getAccessToken();
    const baseUrl = getPayPalBaseUrl();
    const returnUrl = `${env.CLIENT_URL}/payments/return`;
    const cancelUrl = `${env.CLIENT_URL}/payments/cancel`;

    const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: 'USD', value: amount },
            custom_id: userId,
            description: `Regionify ${plan} plan (lifetime, one-time purchase)`,
          },
        ],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
          brand_name: 'Regionify',
          user_action: 'PAY_NOW',
        },
      }),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string; details?: unknown };
      throw new AppError(
        HttpStatus.BAD_GATEWAY,
        ErrorCode.INTERNAL_ERROR,
        err.message ?? 'Failed to create PayPal order',
      );
    }

    const order = (await res.json()) as {
      id: string;
      links?: Array<{ rel: string; href: string }>;
    };
    const approveLink = order.links?.find((l) => l.rel === 'approve');
    if (!approveLink?.href) {
      throw new AppError(
        HttpStatus.BAD_GATEWAY,
        ErrorCode.INTERNAL_ERROR,
        'PayPal did not return approval URL',
      );
    }

    return { orderId: order.id, approvalUrl: approveLink.href };
  },

  /**
   * Capture a PayPal order and upgrade the user's plan. Idempotent: if order already captured, still returns success.
   */
  async captureOrder(userId: string, orderId: string): Promise<{ plan: Plan }> {
    const token = await getAccessToken();
    const baseUrl = getPayPalBaseUrl();

    const getRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!getRes.ok) {
      if (getRes.status === 404) {
        throw new AppError(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, 'Order not found');
      }
      throw new AppError(
        HttpStatus.BAD_GATEWAY,
        ErrorCode.INTERNAL_ERROR,
        'Failed to fetch PayPal order',
      );
    }

    const order = (await getRes.json()) as {
      status: string;
      purchase_units?: Array<{ custom_id?: string; amount?: { value?: string } }>;
    };

    const customId = order.purchase_units?.[0]?.custom_id;
    if (customId && customId !== userId) {
      throw new AppError(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, 'Order does not belong to you');
    }

    if (order.status === 'COMPLETED') {
      const planFromAmount = (
        Object.entries(PLAN_AMOUNTS) as [Exclude<Plan, 'free'>, string][]
      ).find(([, v]) => v === order.purchase_units?.[0]?.amount?.value)?.[0];
      const plan: Plan = planFromAmount ?? PLANS.explorer;
      const user = await userRepository.findById(userId);
      if (user && user.plan !== plan) {
        await userRepository.update(userId, { plan });
      }
      return { plan: plan as Plan };
    }

    if (order.status !== 'APPROVED') {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
        'Order is not approved for capture',
      );
    }

    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: '{}',
    });

    if (!captureRes.ok) {
      const err = (await captureRes.json().catch(() => ({}))) as { message?: string };
      throw new AppError(
        HttpStatus.BAD_GATEWAY,
        ErrorCode.INTERNAL_ERROR,
        err.message ?? 'Failed to capture PayPal order',
      );
    }

    const captureData = (await captureRes.json()) as {
      status: string;
      purchase_units?: Array<{ amount?: { value?: string } }>;
    };

    const amountValue = captureData.purchase_units?.[0]?.amount?.value;
    const planFromAmount = (
      Object.entries(PLAN_AMOUNTS) as [Exclude<Plan, typeof PLANS.free>, string][]
    ).find(([, v]) => v === amountValue)?.[0];
    const plan: Plan = planFromAmount ?? PLANS.explorer;

    await userRepository.update(userId, { plan });

    return { plan: plan as Plan };
  },
};
