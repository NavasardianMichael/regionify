import type { User } from '@prisma/client';

import { prisma } from '../db/index.js';

export type UserCreate = {
  email: string;
  name: string;
  passwordHash?: string | null;
  avatarUrl?: string | null;
  provider?: 'local' | 'google';
  plan?: 'free' | 'explorer' | 'atlas';
  googleId?: string | null;
  emailVerified?: boolean;
};

export type UserUpdate = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  },

  async findByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { googleId },
    });
  },

  async create(data: UserCreate): Promise<User> {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
      },
    });
  },

  async update(id: string, data: UserUpdate): Promise<User | null> {
    try {
      return await prisma.user.update({
        where: { id },
        data,
      });
    } catch {
      // Record not found
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  },

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  },
};
