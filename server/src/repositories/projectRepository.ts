import type { Project } from '@prisma/client';

import { prisma } from '../db/index.js';

export type ProjectCreate = {
  userId: string;
  name: string;
  selectedRegionId?: string | null;
  dataset?: object | null;
  mapStyles?: object | null;
  legendStyles?: object | null;
  legendData?: object | null;
};

export type ProjectUpdate = Partial<Omit<ProjectCreate, 'userId'>>;

export const projectRepository = {
  async findById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
    });
  },

  async findByUserId(userId: string): Promise<Project[]> {
    return prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async create(data: ProjectCreate): Promise<Project> {
    return prisma.project.create({ data });
  },

  async update(id: string, data: ProjectUpdate): Promise<Project | null> {
    try {
      return await prisma.project.update({
        where: { id },
        data,
      });
    } catch {
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.project.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },
};
