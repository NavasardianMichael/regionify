import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
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
  selectProjectsStatus,
  selectRemoveProject,
  selectSetProjects,
  selectSetProjectsStatus,
  selectUpdateProjectInList,
} from '@/store/projects/selectors';
import { useProjectsStore } from '@/store/projects/store';
import { useDebounceValue } from '@/hooks/useDebounce';
import { IDLE_STATUSES, type IdleStatus } from '@/constants/loadingStatus';
import { ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { getLocalizedRegionLabel, getRegionDisplayName } from '@/helpers/regionDisplay';
import { useAppFeedback } from '@/components/shared/useAppFeedback';

type UseProjectsReturn = {
  projects: Project[];
  filteredProjects: Project[];
  projectsStatus: IdleStatus;
  isLoggedIn: boolean;
  search: string;
  renamingProject: Project | null;
  deletingProject: Project | null;
  isDeleting: boolean;
  setSearch: (value: string) => void;
  handleDelete: (project: Project) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;
  handleRenameStart: (project: Project) => void;
  handleRenameConfirm: (trimmedName: string) => Promise<void>;
  handleRenameCancel: () => void;
};

export const useProjects = (): UseProjectsReturn => {
  const { t, i18n } = useTypedTranslation();
  const { message } = useAppFeedback();
  const navigate = useNavigate();
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const logout = useProfileStore(selectLogout);
  const projects = useProjectsStore(selectProjects);
  const projectsStatus = useProjectsStore(selectProjectsStatus);
  const setProjects = useProjectsStore(selectSetProjects);
  const setProjectsStatus = useProjectsStore(selectSetProjectsStatus);
  const removeProject = useProjectsStore(selectRemoveProject);
  const updateProjectInList = useProjectsStore(selectUpdateProjectInList);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounceValue(search, 300);
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /** Guests never fetch; keep list empty and use success so the projects UI can render (empty state + new project). */
  useLayoutEffect(() => {
    if (isLoggedIn) return;
    setProjects([]);
    setProjectsStatus(IDLE_STATUSES.success);
  }, [isLoggedIn, setProjects, setProjectsStatus]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchProjects = async () => {
      setProjectsStatus(IDLE_STATUSES.pending);
      try {
        const data = await getProjects();
        setProjects(data);
        setProjectsStatus(IDLE_STATUSES.success);
      } catch (error) {
        const err = error as Error & { code?: string };
        if (err.code === 'UNAUTHORIZED') {
          logout();
          message.error(t('messages.sessionExpired'));
          navigate(ROUTES.LOGIN);
        } else {
          message.error(t('messages.projectsLoadFailed'));
        }
        setProjectsStatus(IDLE_STATUSES.error);
      }
    };

    void fetchProjects();
  }, [isLoggedIn, setProjects, setProjectsStatus, message, t, logout, navigate]);

  const filteredProjects = useMemo(() => {
    if (!debouncedSearch.trim()) return projects;
    const query = debouncedSearch.toLowerCase();
    const dateLocale = i18n.resolvedLanguage ?? i18n.language;
    return projects.filter((p) => {
      if (p.name.toLowerCase().includes(query)) return true;
      if (p.countryId?.toLowerCase().includes(query)) return true;
      if (!p.countryId) return false;
      const localized = getLocalizedRegionLabel(p.countryId, dateLocale)?.toLowerCase() ?? '';
      const english = getRegionDisplayName(p.countryId)?.toLowerCase() ?? '';
      return localized.includes(query) || english.includes(query);
    });
  }, [projects, debouncedSearch, i18n.language, i18n.resolvedLanguage]);

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
      message.error(t('messages.projectDeleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  }, [deletingProject, removeProject, message, t]);

  const handleDeleteCancel = useCallback(() => {
    setDeletingProject(null);
  }, []);

  const handleRenameStart = useCallback((project: Project) => {
    setRenamingProject(project);
  }, []);

  const handleRenameConfirm = useCallback(
    async (trimmed: string) => {
      if (!renamingProject) return;
      try {
        const updated = await updateProjectApi(renamingProject.id, { name: trimmed });
        updateProjectInList(updated);
        message.success(t('messages.projectRenamed'), 5);
      } catch {
        message.error(t('messages.projectRenameFailed'));
      }
      setRenamingProject(null);
    },
    [renamingProject, updateProjectInList, message, t],
  );

  const handleRenameCancel = useCallback(() => {
    setRenamingProject(null);
  }, []);

  return {
    projects,
    filteredProjects,
    projectsStatus,
    isLoggedIn,
    search,
    renamingProject,
    deletingProject,
    isDeleting,
    setSearch,
    handleDelete,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleRenameStart,
    handleRenameConfirm,
    handleRenameCancel,
  };
};
