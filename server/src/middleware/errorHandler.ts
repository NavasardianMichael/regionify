import { ErrorCode, type ErrorCodeType, HttpStatus } from '@regionify/shared';
import { type NextFunction, type Request, type Response } from 'express';

import { isDev } from '@/config/env.js';
import { logger } from '@/lib/logger.js';

function isPayloadTooLargeError(err: Error): boolean {
  const withType = err as Error & { type?: string; status?: number; statusCode?: number };
  return (
    withType.type === 'entity.too.large' ||
    withType.status === HttpStatus.PAYLOAD_TOO_LARGE ||
    withType.statusCode === HttpStatus.PAYLOAD_TOO_LARGE
  );
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCodeType,
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Log the error
  logger.error({ err }, 'Request error');

  // Handle known AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  if (isPayloadTooLargeError(err)) {
    res.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
      success: false,
      error: {
        code: ErrorCode.PAYLOAD_TOO_LARGE,
        message: 'Request body is too large',
      },
    });
    return;
  }

  // Handle unexpected errors
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      ...(isDev && { devMessage: err.message, stack: err.stack }),
    },
  });
}
