import { Badge, BADGES } from '@regionify/shared';
import { type Router as ExpressRouter, Router, type Request } from 'express';

import { logger } from '@/lib/logger.js';
import { requireAuth } from '@/middleware/requireAuth.js';
import { paymentService } from '@/services/paymentService.js';

const router: ExpressRouter = Router();

type RequestWithRawBody = Request & { rawBody?: Buffer };

/** GET /api/payments/pricing-preview - Return Paddle localized prices for paid badges (no auth). */
router.get('/pricing-preview', async (req, res, next) => {
  try {
    const data = await paymentService.getPricingPreview(req.ip ?? '');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/** POST /api/payments/create-checkout - Create Paddle checkout (auth required). Body: { badge: BADGES.explorer | BADGES.chronographer } */
router.post('/create-checkout', requireAuth, async (req, res, next) => {
  const userId = req.session.userId!;
  const badge = req.body?.badge as Badge;
  try {
    if (badge !== BADGES.explorer && badge !== BADGES.chronographer) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'badge must be explorer or chronographer' },
      });
      return;
    }
    const result = await paymentService.createCheckout(userId, badge, req.headers['user-agent']);
    logger.info({ userId, badge, action: 'checkout_initiated' }, 'checkout created');
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    logger.error(
      { err: error, userId, badge, action: 'payment_failed' },
      'checkout creation failed',
    );
    next(error);
  }
});

/** POST /api/payments/client-error - Log client-side payment errors visible in Grafana (auth required). */
router.post('/client-error', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId!;
    const { error, context } = req.body as { error?: string; context?: Record<string, unknown> };
    logger.error(
      { userId, error, context, action: 'payment_failed' },
      'payment: client-side error',
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/** POST /api/payments/webhook - Paddle webhook (no auth). Verifies Paddle-Signature and handles transaction.completed / transaction.payment_failed. */
router.post('/webhook', (req: RequestWithRawBody, res, next) => {
  const rawBody = req.rawBody;
  const signature = req.get('Paddle-Signature') ?? '';

  logger.debug({ signature: signature.slice(0, 40) }, 'paddle webhook received');

  if (!rawBody) {
    logger.warn('paddle webhook: missing raw body');
    res
      .status(400)
      .json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing body' } });
    return;
  }

  if (!paymentService.verifyWebhookSignature(rawBody, signature)) {
    logger.warn({ signature: signature.slice(0, 40) }, 'paddle webhook: invalid signature');
    res
      .status(401)
      .json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid signature' } });
    return;
  }

  const body = req.body as { event_type?: string };
  const payload = req.body as Parameters<typeof paymentService.handleTransactionCompleted>[0];
  const userId = payload.data?.custom_data?.user_id;
  const priceId = payload.data?.items?.[0]?.price?.id;
  const transactionId = payload.data?.id;

  let resultPromise: Promise<void>;
  switch (body.event_type) {
    case 'transaction.completed':
      logger.info(
        { userId, priceId, transactionId, action: 'payment_completed' },
        'paddle webhook: handling transaction.completed',
      );
      resultPromise = paymentService.handleTransactionCompleted(payload);
      break;
    case 'transaction.payment_failed':
      logger.info(
        { userId, priceId, transactionId, action: 'payment_failed' },
        'paddle webhook: handling transaction.payment_failed',
      );
      resultPromise = paymentService.handleTransactionPaymentFailed(payload);
      break;
    default:
      logger.info({ eventType: body.event_type }, 'paddle webhook: unhandled event type, skipping');
      res.status(200).send();
      return;
  }

  resultPromise
    .then(() => {
      logger.info(
        { userId, priceId, transactionId, eventType: body.event_type },
        'paddle webhook: handling complete',
      );
      res.status(200).send();
    })
    .catch((error: unknown) => {
      logger.error(
        { err: error, userId, priceId, transactionId, eventType: body.event_type },
        'paddle webhook: handling failed',
      );
      next(error);
    });
});

export const paymentRoutes: ExpressRouter = router;
