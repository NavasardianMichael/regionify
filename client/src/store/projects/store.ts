import { create } from 'zustand';
import { IDLE_STATUSES } from '@/constants/loadingStatus';
import type { ProjectsState } from './types';

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  currentProjectId: null,
  savedStateSnapshot: null,
  projectsStatus: IDLE_STATUSES.idle,

  setProjects: (projects) => set({ projects }),

  setCurrentProjectId: (id) => set({ currentProjectId: id }),

  setSavedStateSnapshot: (snapshot) => set({ savedStateSnapshot: snapshot }),

  setProjectsStatus: (projectsStatus) => set({ projectsStatus }),

  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
    })),

  updateProjectInList: (project) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === project.id ? project : p)),
    })),

  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
      savedStateSnapshot: state.currentProjectId === id ? null : state.savedStateSnapshot,
    })),

  removeProjects: (ids) => {
    const idSet = new Set(ids);
    set((state) => {
      const hitsCurrent = state.currentProjectId !== null && idSet.has(state.currentProjectId);
      return {
        projects: state.projects.filter((p) => !idSet.has(p.id)),
        currentProjectId: hitsCurrent ? null : state.currentProjectId,
        savedStateSnapshot: hitsCurrent ? null : state.savedStateSnapshot,
      };
    });
  },
}));
