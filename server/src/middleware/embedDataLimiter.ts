import rateLimit from 'express-rate-limit';

import { env } from '@/config/env.js';

export const embedDataLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: Math.min(env.RATE_LIMIT_MAX_REQUESTS * 2, 300),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
