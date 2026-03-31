import { HttpStatus, ErrorCode, PLAN_DETAILS, Plan, PLANS } from '@regionify/shared';
import crypto from 'node:crypto';

import { env } from '@/config/env.js';
import { AppError } from '@/middleware/errorHandler.js';
import { userRepository } from '@/repositories/userRepository.js';
import type { User } from '@prisma/client';

type PayablePlan = Exclude<Plan, typeof PLANS.observer>;

/** Plan to Lemon Squeezy variant ID (from env). */
function getVariantIdByPlan(plan: PayablePlan): string {
  const id =
    plan === PLANS.explorer
      ? env.LEMON_SQUEEZY_VARIANT_ID_EXPLORER
      : env.LEMON_SQUEEZY_VARIANT_ID_CHRONOGRAPHER;
  if (!id) {
    throw new AppError(
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.INTERNAL_ERROR,
      'Lemon Squeezy variant not configured for this plan',
    );
  }
  return id;
}

/** Plan to price in cents (from shared PLAN_DETAILS). */
function getPriceCents(plan: PayablePlan): number {
  const price = PLAN_DETAILS[plan].price;
  return Math.round(price * 100);
}

export type CreateCheckoutResult = {
  checkoutUrl: string;
};

const LEMON_SQUEEZY_API = 'https://api.lemonsqueezy.com';

export const paymentService = {
  /**
   * Create a Lemon Squeezy checkout for a plan upgrade. Returns URL to redirect the user.
   * Server-only; API key never sent to client.
   */
  async createCheckout(userId: string, plan: PayablePlan): Promise<CreateCheckoutResult> {
    const apiKey = env.LEMON_SQUEEZY_API_KEY;
    const storeId = env.LEMON_SQUEEZY_STORE_ID;
    if (!apiKey || !storeId) {
      throw new AppError(
        HttpStatus.SERVICE_UNAVAILABLE,
        ErrorCode.INTERNAL_ERROR,
        'Lemon Squeezy is not configured',
      );
    }

    const variantId = getVariantIdByPlan(plan);
    const customPrice = getPriceCents(plan);
    const redirectUrl = `${env.CLIENT_URL}/payments/return`;

    const res = await fetch(`${LEMON_SQUEEZY_API}/v1/checkouts`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            custom_price: customPrice,
            product_options: {
              redirect_url: redirectUrl,
              name: `Regionify ${plan} plan`,
              description: `Lifetime access, one-time purchase.`,
            },
            checkout_data: {
              custom: {
                user_id: userId,
              },
            },
          },
          relationships: {
            store: {
              data: { type: 'stores', id: storeId },
            },
            variant: {
              data: { type: 'variants', id: variantId },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { errors?: Array<{ detail?: string }> };
      const detail = err.errors?.[0]?.detail ?? res.statusText;
      throw new AppError(
        HttpStatus.BAD_GATEWAY,
        ErrorCode.INTERNAL_ERROR,
        `Lemon Squeezy checkout failed: ${detail}`,
      );
    }

    const json = (await res.json()) as {
      data?: { attributes?: { url?: string } };
    };
    const checkoutUrl = json.data?.attributes?.url;
    if (!checkoutUrl) {
      throw new AppError(
        HttpStatus.BAD_GATEWAY,
        ErrorCode.INTERNAL_ERROR,
        'Lemon Squeezy did not return a checkout URL',
      );
    }

    return { checkoutUrl };
  },

  /**
   * Verify webhook signature using HMAC-SHA256 (Lemon Squeezy signing).
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const secret = env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    if (!secret) return false;
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const sigBuffer = Buffer.from(signature, 'utf8');
    return digest.length === sigBuffer.length && crypto.timingSafeEqual(digest, sigBuffer);
  },

  /**
   * Handle order_created webhook: upgrade user plan from custom_data.user_id and variant_id.
   * Idempotent.
   */
  async handleOrderCreated(payload: {
    meta?: { custom_data?: { user_id?: string } };
    data?: {
      attributes?: {
        first_order_item?: { variant_id: number };
      };
    };
  }): Promise<void> {
    const userId = payload.meta?.custom_data?.user_id;
    const variantId = payload.data?.attributes?.first_order_item?.variant_id;
    if (!userId || variantId == null) return;

    const variantExplorer = env.LEMON_SQUEEZY_VARIANT_ID_EXPLORER
      ? Number(env.LEMON_SQUEEZY_VARIANT_ID_EXPLORER)
      : null;
    const variantChronographer = env.LEMON_SQUEEZY_VARIANT_ID_CHRONOGRAPHER
      ? Number(env.LEMON_SQUEEZY_VARIANT_ID_CHRONOGRAPHER)
      : null;

    let plan: User['plan'] | null = null;
    if (variantExplorer !== null && variantId === variantExplorer) {
      plan = PLANS.explorer as User['plan'];
    } else if (variantChronographer !== null && variantId === variantChronographer) {
      plan = PLANS.chronographer as User['plan'];
    }
    if (!plan) return;

    const user = await userRepository.findById(userId);
    if (user && user.plan !== plan) {
      await userRepository.update(userId, { plan });
    }
  },
};
