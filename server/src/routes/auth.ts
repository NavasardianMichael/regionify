import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@regionify/shared';
import { type Router as ExpressRouter, Router } from 'express';
import passport from 'passport';

import { env } from '../config/env.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { authService } from '../services/authService.js';

const router: ExpressRouter = Router();

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    // Set session
    req.session.userId = result.user.id;

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

// GET /api/auth/me - Returns current user or null if not authenticated
router.get('/me', async (req, res, next) => {
  try {
    // Return null if no session
    if (!req.session.userId) {
      res.json({
        success: true,
        data: { user: null },
      });
      return;
    }

    const user = await authService.getUserById(req.session.userId);

    if (!user) {
      req.session.destroy(() => {});
      res.clearCookie('regionify.sid');
      res.json({
        success: true,
        data: { user: null },
      });
      return;
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/google
router.get(
  '/google',
  authLimiter,
  passport.authenticate('google', { scope: ['profile', 'email'] }),
);

// GET /api/auth/google/callback
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err) {
      console.error('Google auth error:', err);
      return res.redirect(`${env.CLIENT_URL}/login?error=google_auth_failed`);
    }

    if (!user) {
      console.error('Google auth: no user returned');
      return res.redirect(`${env.CLIENT_URL}/login?error=google_auth_failed`);
    }

    const typedUser = user as { id: string };

    // Regenerate session and set user ID
    req.session.regenerate((sessionErr) => {
      if (sessionErr) {
        console.error('Session regenerate error:', sessionErr);
        return res.redirect(`${env.CLIENT_URL}/login?error=session_error`);
      }

      req.session.userId = typedUser.id;

      // Redirect to client app
      res.redirect(`${env.CLIENT_URL}/auth/callback`);
    });
  })(req, res, next);
});

// GET /api/auth/status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      authenticated: !!req.session.userId,
    },
  });
});

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
