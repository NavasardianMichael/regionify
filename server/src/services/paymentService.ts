import { HttpStatus, ErrorCode, Badge, BADGES } from '@regionify/shared';
import crypto from 'node:crypto';

import { env } from '@/config/env.js';
import { AppError } from '@/middleware/errorHandler.js';
import { userRepository } from '@/repositories/userRepository.js';
import type { User } from '@prisma/client';

type PayableBadge = Exclude<Badge, typeof BADGES.observer>;

const PADDLE_API_BASE =
  env.PADDLE_SANDBOX === 'true' ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com';

/** Paid tier to Paddle price ID (from env). */
function getPriceIdByBadge(badge: PayableBadge): string {
  const id =
    badge === BADGES.explorer ? env.PADDLE_PRICE_ID_EXPLORER : env.PADDLE_PRICE_ID_CHRONOGRAPHER;
  if (!id) {
    throw new AppError(
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.INTERNAL_ERROR,
      'Paddle price not configured for this badge tier',
    );
  }
  return id;
}

export type CreateCheckoutResult = {
  checkoutUrl: string;
};

type TransactionCompletedPayload = {
  data?: {
    custom_data?: { user_id?: string };
    items?: Array<{ price?: { id?: string } }>;
  };
};

export const paymentService = {
  /**
   * Create a Paddle Billing transaction/checkout for a badge tier upgrade. Returns URL to redirect the user.
   * Server-only; API key never sent to client.
   */
  async createCheckout(userId: string, badge: PayableBadge): Promise<CreateCheckoutResult> {
    const apiKey = env.PADDLE_API_KEY;
    if (!apiKey) {
      throw new AppError(
        HttpStatus.SERVICE_UNAVAILABLE,
        ErrorCode.INTERNAL_ERROR,
        'Paddle is not configured',
      );
    }

    const priceId = getPriceIdByBadge(badge);
    const returnUrl = `${env.CLIENT_URL}/payments/return`;

    const res = await fetch(`${PADDLE_API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        custom_data: { user_id: userId },
        checkout: { url: returnUrl },
      }),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: { detail?: string } };
      const detail = err.error?.detail ?? res.statusText;
      throw new AppError(
        HttpStatus.BAD_GATEWAY,
        ErrorCode.INTERNAL_ERROR,
        `Paddle checkout failed: ${detail}`,
      );
    }

    const json = (await res.json()) as {
      data?: { checkout?: { url?: string } };
    };
    const checkoutUrl = json.data?.checkout?.url;
    if (!checkoutUrl) {
      throw new AppError(
        HttpStatus.BAD_GATEWAY,
        ErrorCode.INTERNAL_ERROR,
        'Paddle did not return a checkout URL',
      );
    }

    return { checkoutUrl };
  },

  /**
   * Verify Paddle webhook signature (Paddle-Signature header).
   * Header format: ts=TIMESTAMP;h1=HASH[;h1=HASH2] — all h1 values are checked (key rotation support).
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const secret = env.PADDLE_WEBHOOK_SECRET;
    if (!secret) return false;

    const parts = signature.split(';');
    const ts = parts.find((p) => p.startsWith('ts='))?.slice(3);
    const h1Values = parts.filter((p) => p.startsWith('h1=')).map((p) => p.slice(3));
    if (!ts || h1Values.length === 0) return false;

    // Signed payload is "{ts}:{rawBody}" as bytes — avoid string coercion of rawBody
    const signedPayload = Buffer.concat([Buffer.from(`${ts}:`, 'utf8'), rawBody]);
    const computed = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
    const computedBuf = Buffer.from(computed, 'utf8');

    return h1Values.some((h1) => {
      const h1Buf = Buffer.from(h1, 'utf8');
      return computedBuf.length === h1Buf.length && crypto.timingSafeEqual(computedBuf, h1Buf);
    });
  },

  /**
   * Handle transaction.completed webhook: upgrade user badge from custom_data.user_id and price ID.
   * Idempotent — safe to call multiple times for the same transaction.
   */
  async handleTransactionCompleted(payload: TransactionCompletedPayload): Promise<void> {
    const userId = payload.data?.custom_data?.user_id;
    const priceId = payload.data?.items?.[0]?.price?.id;
    if (!userId || !priceId) return;

    let badge: User['badge'] | null = null;
    if (priceId === env.PADDLE_PRICE_ID_EXPLORER) {
      badge = BADGES.explorer as User['badge'];
    } else if (priceId === env.PADDLE_PRICE_ID_CHRONOGRAPHER) {
      badge = BADGES.chronographer as User['badge'];
    }
    if (!badge) return;

    const user = await userRepository.findById(userId);
    if (user && user.badge !== badge) {
      await userRepository.update(userId, { badge });
    }
    // user not found → return silently so Paddle receives 200 and does not retry
  },
};
