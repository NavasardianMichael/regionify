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
  try {
    const userId = req.session.userId!;
    const badge = req.body?.badge as Badge;
    if (badge !== BADGES.explorer && badge !== BADGES.chronographer) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'badge must be explorer or chronographer' },
      });
      return;
    }
    const result = await paymentService.createCheckout(userId, badge);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/** POST /api/payments/webhook - Paddle webhook (no auth). Verifies Paddle-Signature and handles transaction.completed. */
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
  logger.debug({ eventType: body.event_type }, 'paddle webhook: event type');

  if (body.event_type !== 'transaction.completed') {
    res.status(200).send();
    return;
  }

  const payload = req.body as Parameters<typeof paymentService.handleTransactionCompleted>[0];
  const userId = payload.data?.custom_data?.user_id;
  const priceId = payload.data?.items?.[0]?.price?.id;
  const transactionId = payload.data?.id;

  logger.info(
    { userId, priceId, transactionId, action: 'payment_completed' },
    'paddle webhook: handling transaction.completed',
  );
  paymentService
    .handleTransactionCompleted(payload)
    .then(() => {
      logger.info(
        { userId, priceId, transactionId, action: 'payment_completed' },
        'paddle webhook: badge update complete',
      );
      res.status(200).send();
    })
    .catch(next);
});

export const paymentRoutes: ExpressRouter = router;
