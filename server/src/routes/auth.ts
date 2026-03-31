import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
} from '@regionify/shared';
import { type Router as ExpressRouter, Router } from 'express';
import passport from 'passport';

import { env } from '@/config/env.js';
import { logger } from '@/lib/logger.js';
import { authLimiter } from '@/middleware/rateLimiter.js';
import { requireAuth } from '@/middleware/requireAuth.js';
import { validate } from '@/middleware/validate.js';
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

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }

      req.session.userId = result.user.id;

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
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }

    res.clearCookie('regionify.sid');

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  });
});

// GET /api/auth/google
router.get(
  '/google',
  authLimiter,
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);

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

    // Regenerate session and set user ID
    req.session.regenerate(async (sessionErr) => {
      if (sessionErr) {
        logger.error({ err: sessionErr }, 'Session regenerate error');
        return res.redirect(`${env.CLIENT_URL}/login?error=session_error`);
      }

      req.session.userId = typedUser.id;

      // Fetch public user data to pass to client
      const publicUser = await authService.getUserById(typedUser.id);
      const userParam = Buffer.from(JSON.stringify(publicUser)).toString('base64');

      // Redirect to client app with user data
      res.redirect(`${env.CLIENT_URL}/auth/callback?user=${encodeURIComponent(userParam)}`);
    });
  })(req, res, next);
});

// GET /api/auth/me - Get current user (requires auth); used e.g. after payment return to refresh plan
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
    console.log('Forgot password request received');
    console.log({ body: req.body });
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
router.delete('/account', requireAuth, async (req, res, next) => {
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
