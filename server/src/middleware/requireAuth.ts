import { ErrorCode, HttpStatus } from '@regionify/shared';
import { type NextFunction, type Request, type Response } from 'express';

import { AppError } from './errorHandler.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    next(new AppError(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, 'Authentication required'));
    return;
  }
  next();
}
