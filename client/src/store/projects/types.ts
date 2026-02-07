import type { Project } from '@/api/projects/types';

export type ProjectsState = {
  // State
  projects: Project[];
  currentProjectId: string | null;
  savedStateSnapshot: string | null;
  isLoading: boolean;

  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProjectId: (id: string | null) => void;
  setSavedStateSnapshot: (snapshot: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  addProject: (project: Project) => void;
  updateProjectInList: (project: Project) => void;
  removeProject: (id: string) => void;
};
