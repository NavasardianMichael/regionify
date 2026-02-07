import { PROJECT_ENDPOINTS } from './endpoints';
import type { Project, ProjectCreatePayload, ProjectUpdatePayload } from './types';

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

const getErrorMessage = (data: unknown, fallback: string): string => {
  if (typeof data === 'object' && data !== null) {
    const errorData = data as { error?: { message?: string } };
    if (errorData.error?.message) {
      return errorData.error.message;
    }
  }
  return fallback;
};

export const getProjects = async (): Promise<Project[]> => {
  const response = await fetch(PROJECT_ENDPOINTS.list, {
    credentials: 'include',
  });

  const data = (await response.json()) as ApiResponse<Project[]>;

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to fetch projects'));
  }

  return data.data;
};

export const getProject = async (id: string): Promise<Project> => {
  const response = await fetch(PROJECT_ENDPOINTS.detail(id), {
    credentials: 'include',
  });

  const data = (await response.json()) as ApiResponse<Project>;

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to fetch project'));
  }

  return data.data;
};

export const createProject = async (payload: ProjectCreatePayload): Promise<Project> => {
  const response = await fetch(PROJECT_ENDPOINTS.list, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ApiResponse<Project>;

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to create project'));
  }

  return data.data;
};

export const updateProject = async (
  id: string,
  payload: ProjectUpdatePayload,
): Promise<Project> => {
  const response = await fetch(PROJECT_ENDPOINTS.detail(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ApiResponse<Project>;

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to update project'));
  }

  return data.data;
};

export const deleteProject = async (id: string): Promise<void> => {
  const response = await fetch(PROJECT_ENDPOINTS.detail(id), {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(getErrorMessage(data, 'Failed to delete project'));
  }
};
