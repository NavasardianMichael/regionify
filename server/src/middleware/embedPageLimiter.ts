import rateLimit from 'express-rate-limit';

import { env } from '@/config/env.js';

/**
 * Dedicated limiter for public `/embed/:token` HTML page responses.
 * Keeps public embeds resilient against burst traffic and scraping.
 */
export const embedPageLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: Math.min(env.RATE_LIMIT_MAX_REQUESTS, 80),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    return `${req.ip}:${token ?? 'unknown-token'}`;
  },
});
