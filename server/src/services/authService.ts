import type { User } from '@prisma/client';
import {
  type AuthProvider,
  type AuthResponse,
  ErrorCode,
  type ChangePasswordInput,
  type ForgotPasswordInput,
  HttpStatus,
  type LoginInput,
  type RegisterInput,
  type RegisterResponse,
  type ResetPasswordInput,
  type UpdateProfileInput,
  type UserPublic,
  type VerifyEmailInput,
} from '@regionify/shared';

import { hashPassword, verifyPassword, needsRehash } from '@/lib/password.js';
import { logger } from '@/lib/logger.js';
import { AppError } from '@/middleware/errorHandler.js';
import { emailVerificationRepository } from '@/repositories/emailVerificationRepository.js';
import { passwordResetRepository } from '@/repositories/passwordResetRepository.js';
import { userRepository } from '@/repositories/userRepository.js';
import { emailService } from '@/services/emailService.js';

function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    provider: user.provider as AuthProvider,
    plan: user.plan as UserPublic['plan'],
    locale: (user.locale ?? 'en') as UserPublic['locale'],
    createdAt: user.createdAt.toISOString(),
  };
}

export const authService = {
  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return {
        message: 'If an account exists with this email, a verification email has been sent.',
      };
    }
    if (user.emailVerified) {
      return { message: 'Email is already verified.' };
    }
    const verificationToken = await emailVerificationRepository.create(user.id);
    await emailService.sendVerifyEmail(user.email, user.name, verificationToken.token);
    return { message: 'Verification email sent. Please check your inbox.' };
  },

  async register(input: RegisterInput): Promise<RegisterResponse> {
    // Check if email already exists
    const exists = await userRepository.existsByEmail(input.email);
    if (exists) {
      throw new AppError(
        HttpStatus.CONFLICT,
        ErrorCode.EMAIL_ALREADY_EXISTS,
        'An account with this email already exists',
      );
    }

    // Hash password and create user (unverified)
    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      email: input.email,
      name: input.name,
      passwordHash,
      provider: 'local',
    });

    // Create verification token and send verification email
    const verificationToken = await emailVerificationRepository.create(user.id);

    emailService.sendVerifyEmail(user.email, user.name, verificationToken.token).catch((error) => {
      logger.error({ error, userId: user.id }, 'Failed to send verification email');
    });

    return {
      message: 'Registration successful. Please check your email to verify your account.',
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

    // Block login for unverified local accounts
    if (user.provider === 'local' && !user.emailVerified) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        ErrorCode.EMAIL_NOT_VERIFIED,
        'Please verify your email address before logging in. Check your inbox for the verification link.',
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

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserPublic> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, 'User not found');
    }
    const updateData: { name?: string; locale?: string } = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.locale !== undefined) updateData.locale = input.locale;
    const updated = await userRepository.update(userId, updateData);
    if (!updated) {
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR,
        'Failed to update profile',
      );
    }
    return toPublicUser(updated);
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<{ message: string }> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, 'User not found');
    }
    if (user.provider !== 'local' || !user.passwordHash) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
        'Password change is only available for email/password accounts',
      );
    }
    const valid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS,
        'Current password is incorrect',
      );
    }
    const passwordHash = await hashPassword(input.newPassword);
    await userRepository.update(userId, { passwordHash });
    emailService.sendPasswordChanged(user.email, user.name).catch((error) => {
      logger.error({ error, userId }, 'Failed to send password changed email');
    });
    return { message: 'Password updated successfully' };
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

    emailService.sendAccountDeleted(user.email, user.name).catch((error) => {
      logger.error({ error, userId }, 'Failed to send account deletion email');
    });
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

    // OAuth-only accounts have no password; send guidance email (same anti-enumeration response)
    if (user.provider !== 'local' && !user.passwordHash) {
      logger.info(
        { email: input.email, provider: user.provider },
        'Password reset requested for OAuth-only account',
      );
      try {
        await emailService.sendPasswordResetOAuthNotice(user.email, user.name);
      } catch (error) {
        logger.error({ error, userId: user.id }, 'Failed to send OAuth sign-in notice email');
      }
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

  /**
   * Verify email using token.
   * If token already used but user is verified, returns success (e.g. user double-clicked link).
   */
  async verifyEmail(input: VerifyEmailInput): Promise<{ message: string }> {
    const tokenRecord = await emailVerificationRepository.findValidToken(input.token);

    if (tokenRecord) {
      await userRepository.update(tokenRecord.userId, { emailVerified: true });
      await emailVerificationRepository.markAsUsed(tokenRecord.id);
      emailService.sendWelcome(tokenRecord.user.email, tokenRecord.user.name).catch((error) => {
        logger.error({ error, userId: tokenRecord.userId }, 'Failed to send welcome email');
      });
      return { message: 'Email verified successfully. You can now log in.' };
    }

    const usedRecord = await emailVerificationRepository.findByTokenWithUser(input.token);
    if (usedRecord?.user.emailVerified) {
      return { message: 'Email already verified. You can log in.' };
    }

    throw new AppError(
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_TOKEN,
      'Invalid or expired verification link. Please register again.',
    );
  },
};
