import { create } from 'zustand';

import type { ProjectsState } from './types';

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  currentProjectId: null,
  savedStateSnapshot: null,
  isLoading: false,

  setProjects: (projects) => set({ projects }),

  setCurrentProjectId: (id) => set({ currentProjectId: id }),

  setSavedStateSnapshot: (snapshot) => set({ savedStateSnapshot: snapshot }),

  setLoading: (isLoading) => set({ isLoading }),

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
}));
