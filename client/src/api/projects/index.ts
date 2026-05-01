import { PROJECT_ENDPOINTS } from './endpoints';
import type {
  Project,
  ProjectCreatePayload,
  ProjectEmbedUpdatePayload,
  ProjectEmbedUpdateResponse,
  ProjectUpdatePayload,
} from './types';

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

type ApiErrorResponse = {
  error?: { message?: string };
};

const getErrorMessage = (data: unknown, fallback: string): string => {
  if (typeof data === 'object' && data !== null) {
    const errorData = data as ApiErrorResponse;
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

  const data = (await response.json()) as ApiResponse<Project[]> | ApiErrorResponse;

  if (response.status === 401) {
    const error = new Error(getErrorMessage(data, 'Unauthorized')) as Error & {
      code?: string;
    };
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to fetch projects'));
  }

  return (data as ApiResponse<Project[]>).data;
};

export const getProject = async (id: string): Promise<Project> => {
  const response = await fetch(PROJECT_ENDPOINTS.detail(id), {
    credentials: 'include',
  });

  const data = (await response.json()) as ApiResponse<Project> | ApiErrorResponse;

  if (response.status === 401) {
    const error = new Error(getErrorMessage(data, 'Unauthorized')) as Error & {
      code?: string;
    };
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to fetch project'));
  }

  return (data as ApiResponse<Project>).data;
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

export const updateProjectEmbed = async (
  id: string,
  payload: ProjectEmbedUpdatePayload,
): Promise<ProjectEmbedUpdateResponse> => {
  const response = await fetch(PROJECT_ENDPOINTS.embed(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ApiResponse<ProjectEmbedUpdateResponse>;

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to update embed settings'));
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

export const deleteProjectsBulk = async (ids: string[]): Promise<{ deletedCount: number }> => {
  const response = await fetch(PROJECT_ENDPOINTS.bulkDelete, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ids }),
  });

  const data = (await response.json()) as ApiResponse<{ deletedCount: number }> | ApiErrorResponse;

  if (response.status === 401) {
    const error = new Error(getErrorMessage(data, 'Unauthorized')) as Error & {
      code?: string;
    };
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to delete projects'));
  }

  return (data as ApiResponse<{ deletedCount: number }>).data;
};
