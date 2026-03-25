import { type Router as ExpressRouter, Router } from 'express';

import { env } from '../config/env.js';
import { authRoutes } from './auth.js';
import { contactRoutes } from './contact.js';
import { embedDataRoutes } from './embedData.js';
import { paymentRoutes } from './payments.js';
import { projectRoutes } from './projects.js';
import { sheetsRoutes } from './sheets.js';

const router: ExpressRouter = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      /** Confirms this server serves both path shapes (see app.use(apiRoutes) + app.use('/api', apiRoutes)). */
      authMePaths: ['/auth/me', '/api/auth/me'],
    },
  });
});

/** Opt-in: set HTTP_DEBUG=true to see how nginx/proxies rewrite paths (disable after debugging). */
if (env.HTTP_DEBUG === 'true') {
  router.get('/debug/proxy', (req, res) => {
    res.json({
      success: true,
      data: {
        method: req.method,
        url: req.url,
        originalUrl: req.originalUrl,
        path: req.path,
        baseUrl: req.baseUrl,
        hostname: req.hostname,
        xfProto: req.get('x-forwarded-proto'),
        xfHost: req.get('x-forwarded-host'),
      },
    });
  });
}

// Public embed JSON (CORS-enabled)
router.use(embedDataRoutes);

// Auth routes
router.use('/auth', authRoutes);

// Contact routes
router.use('/contact', contactRoutes);

// Project routes
router.use('/payments', paymentRoutes);
router.use('/projects', projectRoutes);

// Google Sheets routes
router.use('/sheets', sheetsRoutes);

export const apiRoutes: ExpressRouter = router;
