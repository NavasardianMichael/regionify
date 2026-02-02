import Redis from 'ioredis';

import { env } from '../config/env.js';
import { logger } from './logger.js';

export const redis = new Redis.default(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    if (times > 3) {
      logger.error('Redis connection failed after 3 retries');
      return null;
    }
    return Math.min(times * 100, 3000);
  },
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (error: Error) => {
  logger.error({ error }, 'Redis error');
});
