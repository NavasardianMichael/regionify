import { ErrorCode, HttpStatus, BADGES } from '@regionify/shared';
import { type NextFunction, type Request, type Response } from 'express';

import { AppError } from '@/middleware/errorHandler.js';
import { userRepository } from '@/repositories/userRepository.js';

export async function requireChronographer(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userRepository.findById(req.session.userId!);
    if (!user || user.badge !== BADGES.chronographer) {
      next(new AppError(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, 'Chronographer badge required'));
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}
