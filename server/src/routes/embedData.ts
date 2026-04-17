import { type Router as ExpressRouter, Router } from 'express';

import { embedDataCors } from '@/middleware/embedDataCors.js';
import { embedDataLimiter } from '@/middleware/embedDataLimiter.js';
import { projectEmbedService } from '@/services/projectEmbedService.js';

const router: ExpressRouter = Router();

router.options('/embed-data/:token', embedDataCors, (_req, res) => {
  res.status(204).end();
});

router.get('/embed-data/:token', embedDataCors, embedDataLimiter, async (req, res, next) => {
  try {
    const raw = req.params.token;
    const token = Array.isArray(raw) ? raw[0] : raw;
    const data = await projectEmbedService.getPublicPayloadByToken(token);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

export const embedDataRoutes: ExpressRouter = router;
