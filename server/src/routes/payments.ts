import { Plan, PLANS } from '@regionify/shared';
import { type Router as ExpressRouter, Router } from 'express';

import { requireAuth } from '../middleware/requireAuth.js';
import { paymentService } from '../services/paymentService.js';

const router: ExpressRouter = Router();

/** POST /api/payments/create-order - Create PayPal order (auth required). Body: { plan: PLANS.explorer | PLANS.chronographer } */
router.post('/create-order', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId!;
    const plan = req.body?.plan as Plan;
    if (plan !== PLANS.explorer && plan !== PLANS.chronographer) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'plan must be explorer or atlas' },
      });
      return;
    }
    const result = await paymentService.createOrder(userId, plan);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/** POST /api/payments/capture - Capture order after user approval (auth required). Body: { orderId: string } */
router.post('/capture', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId!;
    const orderId = req.body?.orderId as string | undefined;
    if (!orderId || typeof orderId !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'orderId is required' },
      });
      return;
    }
    const result = await paymentService.captureOrder(userId, orderId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export const paymentRoutes: ExpressRouter = router;
