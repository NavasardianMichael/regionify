import type { ProjectsState } from './types';

// State selectors
export const selectProjects = (state: ProjectsState) => state.projects;
export const selectCurrentProjectId = (state: ProjectsState) => state.currentProjectId;
export const selectSavedStateSnapshot = (state: ProjectsState) => state.savedStateSnapshot;
export const selectProjectsLoading = (state: ProjectsState) => state.isLoading;

// Action selectors
export const selectSetProjects = (state: ProjectsState) => state.setProjects;
export const selectSetCurrentProjectId = (state: ProjectsState) => state.setCurrentProjectId;
export const selectSetSavedStateSnapshot = (state: ProjectsState) => state.setSavedStateSnapshot;
export const selectSetProjectsLoading = (state: ProjectsState) => state.setLoading;
export const selectAddProject = (state: ProjectsState) => state.addProject;
export const selectUpdateProjectInList = (state: ProjectsState) => state.updateProjectInList;
export const selectRemoveProject = (state: ProjectsState) => state.removeProject;
