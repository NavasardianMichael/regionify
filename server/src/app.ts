import { RedisStore } from 'connect-redis';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Request } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import passport from 'passport';
import { pinoHttp } from 'pino-http';

import { configurePassport } from './auth/passport.js';
import { env, isProd } from './config/env.js';
import { logger } from './lib/logger.js';
import { redis } from './lib/redis.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { apiRoutes } from './routes/index.js';

export function createApp(): express.Application {
  const app = express();

  // Trust proxy (required for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: isProd,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Requested-With'],
    }),
  );

  // Rate limiting (apply to all routes)
  app.use(generalLimiter);

  // Body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // Request logging
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req: Request) => req.url === '/health',
      },
    }),
  );

  // Session store with Redis (sliding expiration: TTL resets on each request)
  const store = new RedisStore({
    client: redis,
    prefix: 'regionify:session:',
    disableTouch: false,
  });

  app.use(
    session({
      store,
      name: 'regionify.sid',
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      // Sliding expiration: resend cookie + refresh Redis TTL on every request
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: env.SESSION_MAX_AGE,
      },
    }),
  );

  // Passport
  configurePassport();
  app.use(passport.initialize());

  // API routes (mounted at root since we use api. subdomain)
  app.use(apiRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
