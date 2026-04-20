import {
  changePasswordSchema,
  ErrorCode,
  forgotPasswordSchema,
  HttpStatus,
  loginSchema,
  BADGE_DETAILS,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
} from '@regionify/shared';
import { type Router as ExpressRouter, Router } from 'express';
import passport from 'passport';

import { env } from '@/config/env.js';
import { logger } from '@/lib/logger.js';
import { AppError } from '@/middleware/errorHandler.js';
import { authLimiter } from '@/middleware/rateLimiter.js';
import { requireAuth } from '@/middleware/requireAuth.js';
import { validate } from '@/middleware/validate.js';
import { sessionRepository } from '@/repositories/sessionRepository.js';
import { userRepository } from '@/repositories/userRepository.js';
import { authService } from '@/services/authService.js';

const router: ExpressRouter = Router();

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    // Enforce concurrent session limit
    await sessionRepository.deleteExpiredByUserId(result.user.id);
    const sessionCount = await sessionRepository.countActiveByUserId(result.user.id);
    const sessionLimit = BADGE_DETAILS[result.user.badge].limits.maxConcurrentSessions;
    if (sessionLimit !== null && sessionCount >= sessionLimit) {
      if (req.body.forceLogin) {
        await sessionRepository.deleteAllSessionsByUserId(result.user.id);
      } else {
        throw new AppError(
          HttpStatus.FORBIDDEN,
          ErrorCode.SESSION_LIMIT_REACHED,
          `Your account is already active on ${sessionCount} device${sessionCount === 1 ? '' : 's'}. Please log out from another device first.`,
          { sessionLimit: [String(sessionLimit)] },
        );
      }
    }

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }

      req.session.userId = result.user.id;

      const expiresAt = new Date(Date.now() + env.SESSION_MAX_AGE);
      sessionRepository
        .create({
          id: req.sessionID,
          userId: result.user.id,
          expiresAt,
          userAgent: req.headers['user-agent'] ?? null,
          ipAddress: req.ip ?? null,
        })
        .catch((sessionErr) =>
          logger.error({ err: sessionErr }, 'Failed to create session record'),
        );

      res.json({
        success: true,
        data: result,
      });
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res, next) => {
  const sessionId = req.sessionID;
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }

    res.clearCookie('regionify.sid');

    sessionRepository
      .deleteById(sessionId)
      .catch((sessionErr) => logger.error({ err: sessionErr }, 'Failed to delete session record'));

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  });
});

// GET /api/auth/google — prompt=select_account so users can pick another Google account after logout
// Accepts ?force=true to evict all existing sessions on successful login (session limit override)
router.get('/google', authLimiter, (req, res, next) => {
  const force = req.query.force === 'true';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    ...(force && { state: 'force' }),
  })(req, res, next);
});

// GET /api/auth/google/callback
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    if (err) {
      logger.error({ err, query: req.query }, 'Google auth error');
      return res.redirect(`${env.CLIENT_URL}/login?error=google_auth_failed`);
    }

    if (!user) {
      logger.error({ info, query: req.query }, 'Google auth: no user returned');
      return res.redirect(`${env.CLIENT_URL}/login?error=google_auth_failed`);
    }

    const typedUser = user as { id: string };

    // Enforce concurrent session limit
    const dbUser = await userRepository.findById(typedUser.id);
    if (!dbUser) {
      logger.error({ userId: typedUser.id }, 'Google auth: user not found in DB');
      return res.redirect(`${env.CLIENT_URL}/login?error=google_auth_failed`);
    }
    await sessionRepository.deleteExpiredByUserId(typedUser.id);
    const sessionCount = await sessionRepository.countActiveByUserId(typedUser.id);
    const sessionLimit = BADGE_DETAILS[dbUser.badge].limits.maxConcurrentSessions;
    if (sessionLimit !== null && sessionCount >= sessionLimit) {
      if (req.query.state === 'force') {
        await sessionRepository.deleteAllSessionsByUserId(typedUser.id);
      } else {
        return res.redirect(`${env.CLIENT_URL}/login?error=session_limit&max=${sessionLimit}`);
      }
    }

    // Regenerate session and set user ID
    req.session.regenerate(async (sessionErr) => {
      if (sessionErr) {
        logger.error({ err: sessionErr }, 'Session regenerate error');
        return res.redirect(`${env.CLIENT_URL}/login?error=session_error`);
      }

      req.session.userId = typedUser.id;

      const expiresAt = new Date(Date.now() + env.SESSION_MAX_AGE);
      sessionRepository
        .create({
          id: req.sessionID,
          userId: typedUser.id,
          expiresAt,
          userAgent: req.headers['user-agent'] ?? null,
          ipAddress: req.ip ?? null,
        })
        .catch((createErr) => logger.error({ err: createErr }, 'Failed to create session record'));

      // Session cookie carries identity — redirect without embedding user data in the URL
      res.redirect(`${env.CLIENT_URL}/auth/callback`);
    });
  })(req, res, next);
});

// GET /api/auth/me - Get current user (requires auth); used e.g. after payment return to refresh badge tier
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId!;
    const user = await authService.getUserById(userId);
    if (!user) {
      res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/auth/profile - Update profile (name); requires auth
router.patch('/profile', requireAuth, validate(updateProfileSchema), async (req, res, next) => {
  try {
    const userId = req.session.userId!;
    const user = await authService.updateProfile(userId, req.body);
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/change-password - Change password when logged in; requires auth
router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  async (req, res, next) => {
    try {
      const userId = req.session.userId!;
      const result = await authService.changePassword(userId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  async (req, res, next) => {
    try {
      const result = await authService.forgotPassword(req.body);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  async (req, res, next) => {
    try {
      const result = await authService.resetPassword(req.body);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/auth/resend-verification-email
router.post('/resend-verification-email', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }
    const result = await authService.resendVerification(email);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', authLimiter, validate(verifyEmailSchema), async (req, res, next) => {
  try {
    const result = await authService.verifyEmail(req.body);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/auth/account
router.delete('/account', requireAuth, authLimiter, async (req, res, next) => {
  try {
    const userId = req.session.userId!;

    await authService.deleteAccount(userId);

    // Destroy session after account deletion
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }

      res.clearCookie('regionify.sid');

      res.json({
        success: true,
        data: { message: 'Account deleted successfully' },
      });
    });
  } catch (error) {
    next(error);
  }
});

export const authRoutes: ExpressRouter = router;
