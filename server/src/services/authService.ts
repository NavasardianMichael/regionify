import type { User } from '@prisma/client';
import {
  type AuthProvider,
  type AuthResponse,
  ErrorCode,
  type ForgotPasswordInput,
  HttpStatus,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type UserPublic,
} from '@regionify/shared';

import { hashPassword, verifyPassword, needsRehash } from '../lib/password.js';
import { logger } from '../lib/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import { passwordResetRepository } from '../repositories/passwordResetRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { emailService } from './emailService.js';

function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    provider: user.provider as AuthProvider,
    plan: user.plan as UserPublic['plan'],
    createdAt: user.createdAt.toISOString(),
  };
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if email already exists
    const exists = await userRepository.existsByEmail(input.email);
    if (exists) {
      throw new AppError(
        HttpStatus.CONFLICT,
        ErrorCode.EMAIL_ALREADY_EXISTS,
        'An account with this email already exists',
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      email: input.email,
      name: input.name,
      passwordHash,
      provider: 'local',
    });

    // Send welcome email (don't block on failure)
    emailService.sendWelcome(user.email, user.name).catch((error) => {
      logger.error({ error, userId: user.id }, 'Failed to send welcome email');
    });

    return {
      user: toPublicUser(user),
      message: 'Registration successful',
    };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await userRepository.findByEmail(input.email);

    if (!user || !user.passwordHash) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password',
      );
    }

    const isValid = await verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password',
      );
    }

    // Rehash password if needed (security upgrade path)
    if (needsRehash(user.passwordHash)) {
      const newHash = await hashPassword(input.password);
      await userRepository.update(user.id, { passwordHash: newHash });
    }

    return {
      user: toPublicUser(user),
      message: 'Login successful',
    };
  },

  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<UserPublic> {
    // First, try to find by Google ID
    let user = await userRepository.findByGoogleId(profile.googleId);

    if (user) {
      return toPublicUser(user);
    }

    // Check if user exists with same email
    user = await userRepository.findByEmail(profile.email);

    if (user) {
      // Link Google account to existing user
      const updated = await userRepository.update(user.id, {
        googleId: profile.googleId,
        avatarUrl: user.avatarUrl ?? profile.avatarUrl,
        emailVerified: true,
      });
      return toPublicUser(updated!);
    }

    // Create new user
    user = await userRepository.create({
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      provider: 'google',
      googleId: profile.googleId,
      emailVerified: true,
    });

    return toPublicUser(user);
  },

  async getUserById(id: string): Promise<UserPublic | null> {
    const user = await userRepository.findById(id);
    return user ? toPublicUser(user) : null;
  },

  async deleteAccount(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, 'User not found');
    }

    const deleted = await userRepository.delete(userId);

    if (!deleted) {
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR,
        'Failed to delete account',
      );
    }
  },

  /**
   * Request password reset - sends email with reset link
   * Always returns success to prevent email enumeration
   */
  async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(input.email);

    // Always return success to prevent email enumeration attacks
    if (!user) {
      logger.info({ email: input.email }, 'Password reset requested for non-existent email');
      return {
        message: 'If an account exists with this email, you will receive a password reset link',
      };
    }

    // Don't allow password reset for OAuth-only accounts
    if (user.provider !== 'local' && !user.passwordHash) {
      logger.info(
        { email: input.email, provider: user.provider },
        'Password reset requested for OAuth account',
      );
      return {
        message: 'If an account exists with this email, you will receive a password reset link',
      };
    }

    // Create reset token
    const resetToken = await passwordResetRepository.create(user.id);

    // Send email (don't block on failure, but log it)
    try {
      await emailService.sendPasswordReset(user.email, user.name, resetToken.token);
    } catch (error) {
      logger.error({ error, userId: user.id }, 'Failed to send password reset email');
      // Still return success to prevent enumeration
    }

    return {
      message: 'If an account exists with this email, you will receive a password reset link',
    };
  },

  /**
   * Reset password using token
   */
  async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const tokenRecord = await passwordResetRepository.findValidToken(input.token);

    if (!tokenRecord) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_TOKEN,
        'Invalid or expired reset token',
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(input.password);

    // Update user's password
    await userRepository.update(tokenRecord.userId, { passwordHash });

    // Mark token as used
    await passwordResetRepository.markAsUsed(tokenRecord.id);

    // Send confirmation email (don't block on failure)
    emailService
      .sendPasswordChanged(tokenRecord.user.email, tokenRecord.user.name)
      .catch((error) => {
        logger.error(
          { error, userId: tokenRecord.userId },
          'Failed to send password changed email',
        );
      });

    return { message: 'Password reset successfully' };
  },
};
