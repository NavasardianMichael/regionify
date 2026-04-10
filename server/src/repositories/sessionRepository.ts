import { prisma } from '@/db/index.js';

export type SessionCreate = {
  id: string;
  userId: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
};

export const sessionRepository = {
  async create(data: SessionCreate): Promise<void> {
    await prisma.session.create({ data });
  },

  async deleteById(id: string): Promise<void> {
    try {
      await prisma.session.delete({ where: { id } });
    } catch {
      // Session may have already been deleted or expired — ignore
    }
  },

  async deleteExpiredByUserId(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId, expiresAt: { lte: new Date() } },
    });
  },

  async countActiveByUserId(userId: string): Promise<number> {
    return prisma.session.count({
      where: { userId, expiresAt: { gt: new Date() } },
    });
  },

  async deleteAllSessionsByUserId(userId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { userId } });
  },
};
