import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  deleteProject as deleteProjectApi,
  getProjects,
  updateProject as updateProjectApi,
} from '@/api/projects';
import type { Project } from '@/api/projects/types';
import { selectIsLoggedIn, selectLogout } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import {
  selectProjects,
  selectProjectsLoading,
  selectRemoveProject,
  selectSetProjects,
  selectSetProjectsLoading,
  selectUpdateProjectInList,
} from '@/store/projects/selectors';
import { useProjectsStore } from '@/store/projects/store';
import { useDebounceValue } from '@/hooks/useDebounce';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { useAppFeedback } from '@/components/shared/useAppFeedback';

type UseProjectsReturn = {
  projects: Project[];
  filteredProjects: Project[];
  isLoading: boolean;
  isLoggedIn: boolean;
  search: string;
  renamingProject: Project | null;
  newName: string;
  deletingProject: Project | null;
  isDeleting: boolean;
  setSearch: (value: string) => void;
  handleDelete: (project: Project) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;
  handleRenameStart: (project: Project) => void;
  handleRenameConfirm: () => Promise<void>;
  handleRenameCancel: () => void;
  setNewName: (value: string) => void;
};

export const useProjects = (): UseProjectsReturn => {
  const { t } = useTypedTranslation();
  const { message } = useAppFeedback();
  const navigate = useNavigate();
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const logout = useProfileStore(selectLogout);
  const projects = useProjectsStore(selectProjects);
  const isLoading = useProjectsStore(selectProjectsLoading);
  const setProjects = useProjectsStore(selectSetProjects);
  const setLoading = useProjectsStore(selectSetProjectsLoading);
  const removeProject = useProjectsStore(selectRemoveProject);
  const updateProjectInList = useProjectsStore(selectUpdateProjectInList);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounceValue(search, 300);
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);
  const [newName, setNewName] = useState('');
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchProjects = async () => {
      setLoading(true);
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        const err = error as Error & { code?: string };
        if (err.code === 'UNAUTHORIZED') {
          logout();
          message.error('Session expired. Please log in again.', 0);
          navigate(ROUTES.LOGIN);
        } else {
          message.error(t('messages.projectsLoadFailed'), 0);
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchProjects();
  }, [isLoggedIn, setProjects, setLoading, message, t, logout, navigate]);

  const filteredProjects = useMemo(() => {
    if (!debouncedSearch.trim()) return projects;
    const query = debouncedSearch.toLowerCase();
    return projects.filter(
      (p) => p.name.toLowerCase().includes(query) || p.countryId?.toLowerCase().includes(query),
    );
  }, [projects, debouncedSearch]);

  const handleDelete = useCallback((project: Project) => {
    setDeletingProject(project);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingProject) return;
    setIsDeleting(true);
    try {
      await deleteProjectApi(deletingProject.id);
      removeProject(deletingProject.id);
      message.success(t('messages.projectDeleted'), 5);
      setDeletingProject(null);
    } catch {
      message.error(t('messages.projectDeleteFailed'), 0);
    } finally {
      setIsDeleting(false);
    }
  }, [deletingProject, removeProject, message, t]);

  const handleDeleteCancel = useCallback(() => {
    setDeletingProject(null);
  }, []);

  const handleRenameStart = useCallback((project: Project) => {
    setRenamingProject(project);
    setNewName(project.name);
  }, []);

  const handleRenameConfirm = useCallback(async () => {
    if (!renamingProject) return;
    const trimmed = newName.trim();
    if (trimmed && trimmed !== renamingProject.name) {
      try {
        const updated = await updateProjectApi(renamingProject.id, { name: trimmed });
        updateProjectInList(updated);
        message.success(t('messages.projectRenamed'), 5);
      } catch {
        message.error(t('messages.projectRenameFailed'), 0);
      }
    }
    setRenamingProject(null);
    setNewName('');
  }, [renamingProject, newName, updateProjectInList, message, t]);

  const handleRenameCancel = useCallback(() => {
    setRenamingProject(null);
    setNewName('');
  }, []);

  return {
    projects,
    filteredProjects,
    isLoading,
    isLoggedIn,
    search,
    renamingProject,
    newName,
    deletingProject,
    isDeleting,
    setSearch,
    handleDelete,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleRenameStart,
    handleRenameConfirm,
    handleRenameCancel,
    setNewName,
  };
};
