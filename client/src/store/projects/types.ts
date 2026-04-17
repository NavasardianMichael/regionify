import type { Project } from '@/api/projects/types';
import type { IdleStatus } from '@/constants/loadingStatus';

export type ProjectsState = {
  // State
  projects: Project[];
  currentProjectId: string | null;
  savedStateSnapshot: string | null;
  projectsStatus: IdleStatus;

  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProjectId: (id: string | null) => void;
  setSavedStateSnapshot: (snapshot: string | null) => void;
  setProjectsStatus: (status: IdleStatus) => void;
  addProject: (project: Project) => void;
  updateProjectInList: (project: Project) => void;
  removeProject: (id: string) => void;
};
