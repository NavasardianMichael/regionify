import { loginSchema, registerSchema } from '@regionify/shared';
import { type Router as ExpressRouter, Router } from 'express';
import passport from 'passport';

import { env } from '../config/env.js';
import { authLimiter, requireAuth, validate } from '../middleware/index.js';
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

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.session.userId!);

    if (!user) {
      req.session.destroy(() => {});
      res.clearCookie('regionify.sid');
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found',
        },
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
router.get('/google', authLimiter, passport.authenticate('google'));

// GET /api/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${env.CLIENT_URL}/login?error=google_auth_failed`,
    session: false,
  }),
  (req, res) => {
    // User is attached by passport
    const user = req.user as { id: string };

    // Regenerate session and set user ID
    req.session.regenerate((err) => {
      if (err) {
        res.redirect(`${env.CLIENT_URL}/login?error=session_error`);
        return;
      }

      req.session.userId = user.id;

      // Redirect to client app
      res.redirect(`${env.CLIENT_URL}/auth/callback`);
    });
  },
);

// GET /api/auth/status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      authenticated: !!req.session.userId,
    },
  });
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
