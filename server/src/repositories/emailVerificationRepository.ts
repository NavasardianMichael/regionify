import type { EmailVerificationToken } from '@prisma/client';
import crypto from 'crypto';

import { prisma } from '../db/index.js';

const TOKEN_EXPIRY_HOURS = 24; // 24 hours

export const emailVerificationRepository = {
  /**
   * Generate a secure random token
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  },

  /**
   * Create an email verification token for a user
   * Invalidates any existing unused tokens for the user
   */
  async create(userId: string): Promise<EmailVerificationToken> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Delete any existing unused tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: {
        userId,
        usedAt: null,
      },
    });

    return prisma.emailVerificationToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  },

  /**
   * Find a valid (not expired, not used) token
   */
  async findValidToken(
    token: string,
  ): Promise<
    (EmailVerificationToken & { user: { id: string; email: string; name: string } }) | null
  > {
    return prisma.emailVerificationToken.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  },

  /**
   * Mark a token as used
   */
  async markAsUsed(id: string): Promise<void> {
    await prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  },

  /**
   * Clean up expired tokens (can be run periodically)
   */
  async deleteExpired(): Promise<number> {
    const result = await prisma.emailVerificationToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
      },
    });
    return result.count;
  },
};
