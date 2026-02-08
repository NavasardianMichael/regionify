import { type Router as ExpressRouter, Router } from 'express';

import { authRoutes } from './auth.js';
import { contactRoutes } from './contact.js';
import { paymentRoutes } from './payments.js';
import { projectRoutes } from './projects.js';

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

// Project routes
router.use('/payments', paymentRoutes);
router.use('/projects', projectRoutes);

export const apiRoutes: ExpressRouter = router;
