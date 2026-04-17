import { Badge, BADGES } from '@regionify/shared';
import { type Router as ExpressRouter, Router, type Request } from 'express';

import { requireAuth } from '@/middleware/requireAuth.js';
import { paymentService } from '@/services/paymentService.js';

const router: ExpressRouter = Router();

type RequestWithRawBody = Request & { rawBody?: Buffer };

/** POST /api/payments/create-checkout - Create Lemon Squeezy checkout (auth required). Body: { badge: BADGES.explorer | BADGES.chronographer } */
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

/** POST /api/payments/webhook - Lemon Squeezy webhook (no auth). Verifies X-Signature and handles order_created. */
router.post('/webhook', (req: RequestWithRawBody, res, next) => {
  const rawBody = req.rawBody;
  const signature = req.get('X-Signature') ?? '';
  const eventName = req.get('X-Event-Name');

  if (!rawBody) {
    res
      .status(400)
      .json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing body' } });
    return;
  }

  if (!paymentService.verifyWebhookSignature(rawBody, signature)) {
    res
      .status(401)
      .json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid signature' } });
    return;
  }

  if (eventName !== 'order_created') {
    res.status(200).send();
    return;
  }

  const payload = req.body as Parameters<typeof paymentService.handleOrderCreated>[0];
  paymentService
    .handleOrderCreated(payload)
    .then(() => res.status(200).send())
    .catch(next);
});

export const paymentRoutes: ExpressRouter = router;
