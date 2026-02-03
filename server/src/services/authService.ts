import type { User } from '@prisma/client';
import {
  type AuthProvider,
  type AuthResponse,
  ErrorCode,
  HttpStatus,
  type LoginInput,
  type RegisterInput,
  type UserPublic,
} from '@regionify/shared';

import { hashPassword, verifyPassword, needsRehash } from '../lib/password.js';
import { AppError } from '../middleware/errorHandler.js';
import { userRepository } from '../repositories/userRepository.js';

function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    provider: user.provider as AuthProvider,
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
};
