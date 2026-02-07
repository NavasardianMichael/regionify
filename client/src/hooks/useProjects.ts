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
        message.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    void fetchProjects();
  }, [isLoggedIn, setProjects, setLoading, message]);

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
        title: 'Delete Project',
        icon: null,
        content: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
        okText: 'Delete',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await deleteProjectApi(project.id);
            removeProject(project.id);
            message.success('Project deleted');
          } catch {
            message.error('Failed to delete project');
          }
        },
      });
    },
    [modal, removeProject, message],
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
        message.success('Project renamed');
      } catch {
        message.error('Failed to rename project');
      }
    }
    setRenamingProject(null);
    setNewName('');
  }, [renamingProject, newName, updateProjectInList, message]);

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
