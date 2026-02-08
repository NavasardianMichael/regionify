import { Prisma, type Project } from '@prisma/client';
import type { InputJsonValue } from '@prisma/client/runtime/library';

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

const JSON_FIELDS = ['dataset', 'mapStyles', 'legendStyles', 'legendData'] as const;

/** Converts plain `null` to `Prisma.JsonNull` for nullable JSON columns */
function normalizeJsonFields<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data };
  for (const key of JSON_FIELDS) {
    if (key in result) {
      result[key as keyof T] =
        result[key as keyof T] === null
          ? (Prisma.JsonNull as unknown as T[keyof T])
          : (result[key as keyof T] as InputJsonValue as unknown as T[keyof T]);
    }
  }
  return result;
}

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
    return prisma.project.create({
      data: normalizeJsonFields(data) as Prisma.ProjectUncheckedCreateInput,
    });
  },

  async update(id: string, data: ProjectUpdate): Promise<Project | null> {
    try {
      return await prisma.project.update({
        where: { id },
        data: normalizeJsonFields(data) as Prisma.ProjectUncheckedUpdateInput,
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
