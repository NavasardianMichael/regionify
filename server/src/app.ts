import connectRedis from 'connect-redis';
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
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }),
  );

  // Rate limiting
  app.use('/api', generalLimiter);

  // Body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // Request logging
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req: Request) => req.url === '/api/health',
      },
    }),
  );

  // Session store with Redis
  const RedisStore = connectRedis(session);
  const store = new RedisStore({
    client: redis,
    prefix: 'regionify:sess:',
  });

  app.use(
    session({
      store,
      name: 'regionify.sid',
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      rolling: true, // Reset expiry on activity
      cookie: {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: env.SESSION_MAX_AGE,
        domain: isProd ? undefined : undefined, // Set in production
      },
    }),
  );

  // Passport
  configurePassport();
  app.use(passport.initialize());

  // API routes
  app.use('/api', apiRoutes);

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
