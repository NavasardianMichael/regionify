import { type Router as ExpressRouter, Router } from 'express';

import { authRoutes } from './auth.js';
import { contactRoutes } from './contact.js';

const router: ExpressRouter = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Contact routes
router.use('/contact', contactRoutes);

export const apiRoutes: ExpressRouter = router;
