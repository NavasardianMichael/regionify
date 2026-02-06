import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { authService } from '../services/authService.js';

export function configurePassport(): void {
  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          logger.debug({ profile }, 'Google profile received');

          const email = profile.emails?.[0]?.value;
          if (!email) {
            logger.error('No email provided by Google');
            return done(new Error('No email provided by Google'));
          }

          const user = await authService.findOrCreateGoogleUser({
            googleId: profile.id,
            email,
            name: profile.displayName || email.split('@')[0],
            avatarUrl: profile.photos?.[0]?.value,
          });

          logger.debug({ userId: user.id }, 'Google user authenticated');
          return done(null, user);
        } catch (error) {
          logger.error({ err: error }, 'Google auth error');
          return done(error as Error);
        }
      },
    ),
  );

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user, done) => {
    done(null, user as Express.User);
  });
}
