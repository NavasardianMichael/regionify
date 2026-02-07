import type { Project } from '@prisma/client';
import { ErrorCode, HttpStatus } from '@regionify/shared';

import { AppError } from '../middleware/errorHandler.js';
import {
  projectRepository,
  type ProjectCreate,
  type ProjectUpdate,
} from '../repositories/projectRepository.js';

export type ProjectPublic = {
  id: string;
  name: string;
  selectedRegionId: string | null;
  dataset: unknown;
  mapStyles: unknown;
  legendStyles: unknown;
  legendData: unknown;
  createdAt: string;
  updatedAt: string;
};

function toPublicProject(project: Project): ProjectPublic {
  return {
    id: project.id,
    name: project.name,
    selectedRegionId: project.selectedRegionId,
    dataset: project.dataset,
    mapStyles: project.mapStyles,
    legendStyles: project.legendStyles,
    legendData: project.legendData,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export const projectService = {
  async getProjectsByUser(userId: string): Promise<ProjectPublic[]> {
    const projects = await projectRepository.findByUserId(userId);
    return projects.map(toPublicProject);
  },

  async getProjectById(userId: string, projectId: string): Promise<ProjectPublic> {
    const project = await projectRepository.findById(projectId);

    if (!project || project.userId !== userId) {
      throw new AppError(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, 'Project not found');
    }

    return toPublicProject(project);
  },

  async createProject(userId: string, data: Omit<ProjectCreate, 'userId'>): Promise<ProjectPublic> {
    const project = await projectRepository.create({ ...data, userId });
    return toPublicProject(project);
  },

  async updateProject(
    userId: string,
    projectId: string,
    data: ProjectUpdate,
  ): Promise<ProjectPublic> {
    const existing = await projectRepository.findById(projectId);

    if (!existing || existing.userId !== userId) {
      throw new AppError(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, 'Project not found');
    }

    const updated = await projectRepository.update(projectId, data);

    if (!updated) {
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR,
        'Failed to update project',
      );
    }

    return toPublicProject(updated);
  },

  async deleteProject(userId: string, projectId: string): Promise<void> {
    const existing = await projectRepository.findById(projectId);

    if (!existing || existing.userId !== userId) {
      throw new AppError(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, 'Project not found');
    }

    const deleted = await projectRepository.delete(projectId);

    if (!deleted) {
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR,
        'Failed to delete project',
      );
    }
  },
};
