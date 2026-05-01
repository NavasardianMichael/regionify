import type { ProjectsState } from './types';

// State selectors
export const selectProjects = (state: ProjectsState) => state.projects;
export const selectCurrentProjectId = (state: ProjectsState) => state.currentProjectId;
export const selectSavedStateSnapshot = (state: ProjectsState) => state.savedStateSnapshot;
export const selectProjectsStatus = (state: ProjectsState) => state.projectsStatus;
export const selectCurrentProject = (state: ProjectsState) => {
  if (!state.currentProjectId) return null;
  return state.projects.find((p) => p.id === state.currentProjectId) ?? null;
};

// Action selectors
export const selectSetProjects = (state: ProjectsState) => state.setProjects;
export const selectSetCurrentProjectId = (state: ProjectsState) => state.setCurrentProjectId;
export const selectSetSavedStateSnapshot = (state: ProjectsState) => state.setSavedStateSnapshot;
export const selectSetProjectsStatus = (state: ProjectsState) => state.setProjectsStatus;
export const selectAddProject = (state: ProjectsState) => state.addProject;
export const selectUpdateProjectInList = (state: ProjectsState) => state.updateProjectInList;
export const selectRemoveProject = (state: ProjectsState) => state.removeProject;
export const selectRemoveProjects = (state: ProjectsState) => state.removeProjects;
