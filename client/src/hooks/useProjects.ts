import { useCallback, useEffect, useMemo, useState } from 'react';
import { App } from 'antd';
import {
  deleteProject as deleteProjectApi,
  getProjects,
  updateProject as updateProjectApi,
} from '@/api/projects';
import type { Project } from '@/api/projects/types';
import { selectIsLoggedIn } from '@/store/profile/selectors';
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
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type UseProjectsReturn = {
  projects: Project[];
  filteredProjects: Project[];
  isLoading: boolean;
  isLoggedIn: boolean;
  search: string;
  renamingProject: Project | null;
  newName: string;
  setSearch: (value: string) => void;
  handleDelete: (project: Project) => void;
  handleRenameStart: (project: Project) => void;
  handleRenameConfirm: () => Promise<void>;
  handleRenameCancel: () => void;
  setNewName: (value: string) => void;
};

export function useProjects(): UseProjectsReturn {
  const { t } = useTypedTranslation();
  const { message, modal } = App.useApp();
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const projects = useProjectsStore(selectProjects);
  const isLoading = useProjectsStore(selectProjectsLoading);
  const setProjects = useProjectsStore(selectSetProjects);
  const setLoading = useProjectsStore(selectSetProjectsLoading);
  const removeProject = useProjectsStore(selectRemoveProject);
  const updateProjectInList = useProjectsStore(selectUpdateProjectInList);

  const [search, setSearch] = useState('');
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchProjects = async () => {
      setLoading(true);
      try {
        const data = await getProjects();
        setProjects(data);
      } catch {
        message.error(t('messages.projectsLoadFailed'), 0);
      } finally {
        setLoading(false);
      }
    };

    void fetchProjects();
  }, [isLoggedIn, setProjects, setLoading, message, t]);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const query = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) || p.selectedRegionId?.toLowerCase().includes(query),
    );
  }, [projects, search]);

  const handleDelete = useCallback(
    (project: Project) => {
      modal.confirm({
        title: t('messages.deleteProjectTitle'),
        icon: null,
        content: t('messages.deleteProjectContent', { name: project.name }),
        okText: t('messages.deleteProjectOk'),
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await deleteProjectApi(project.id);
            removeProject(project.id);
            message.success(t('messages.projectDeleted'), 5);
          } catch {
            message.error(t('messages.projectDeleteFailed'), 0);
          }
        },
      });
    },
    [modal, removeProject, message, t],
  );

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
    setSearch,
    handleDelete,
    handleRenameStart,
    handleRenameConfirm,
    handleRenameCancel,
    setNewName,
  };
}
