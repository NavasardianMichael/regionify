import { type FC, lazy, startTransition, Suspense, useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { PLAN_DETAILS } from '@regionify/shared';
import { Button, Empty, Flex, Input, Modal, Spin, Typography } from 'antd';
import type { Project } from '@/api/projects/types';
import { selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { useLoadProject } from '@/hooks/useLoadProject';
import { useProjects } from '@/hooks/useProjects';
import { IDLE_STATUSES } from '@/constants/loadingStatus';
import { getProjectRoute, ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { clearReturnUrl, clearTemporaryProjectState } from '@/helpers/temporaryProjectState';
import { ProjectCard } from '@/components/projects/ProjectCard';

const RenameProjectModal = lazy(() =>
  import('@/components/projects/RenameProjectModal/Modal').then((m) => ({
    default: m.RenameProjectModal,
  })),
);
const DeleteProjectModal = lazy(() =>
  import('@/components/projects/DeleteProjectModal/Modal').then((m) => ({
    default: m.DeleteProjectModal,
  })),
);

const ProjectsPage: FC = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const loadProject = useLoadProject();
  const [openingProjectId, setOpeningProjectId] = useState<string | null>(null);
  const user = useProfileStore(selectUser);
  const {
    projects,
    filteredProjects,
    projectsStatus,
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
  } = useProjects();

  useEffect(() => {
    void import('@/pages/VisualizerPage');
  }, []);

  useEffect(() => {
    const path = location.pathname;
    const onSavedProjectRoute =
      path.startsWith('/projects/') &&
      path !== ROUTES.PROJECT_NEW &&
      path !== ROUTES.PROJECT_EDITOR;
    if (onSavedProjectRoute) {
      setOpeningProjectId(null);
    }
  }, [location.pathname]);

  const handleOpen = useCallback(
    (project: Project) => {
      setOpeningProjectId(project.id);
      requestAnimationFrame(() => {
        loadProject(project);
        startTransition(() => {
          navigate(getProjectRoute(project.id));
        });
      });
    },
    [loadProject, navigate],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    [setSearch],
  );

  const handleNewProject = useCallback(() => {
    const limit = user ? PLAN_DETAILS[user.plan].limits.maxProjectsCount : null;
    if (limit !== null && projects.length >= limit) {
      Modal.warning({
        title: t('projects.limitReachedTitle'),
        content: t('projects.limitReachedContent', { count: limit }),
      });
      return;
    }
    clearTemporaryProjectState();
    clearReturnUrl();
    navigate(ROUTES.PROJECT_NEW);
  }, [navigate, projects.length, user, t]);

  return (
    <>
      <Flex vertical className="mx-auto h-full w-full" gap="middle">
        {projectsStatus !== IDLE_STATUSES.idle ? (
          <>
            <Flex align="center" justify="space-between" wrap="wrap" gap="middle">
              <Typography.Title
                level={2}
                className="text-primary mb-0! text-xl font-bold"
                data-i18n-key="projects.title"
              >
                {t('projects.title')}
              </Typography.Title>
              {projects.length > 0 && (
                <Flex gap="middle">
                  <Input.Search
                    placeholder={t('projects.searchPlaceholder')}
                    className="w-64"
                    value={search}
                    onChange={handleSearchChange}
                    allowClear
                    data-i18n-key="projects.searchPlaceholder"
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleNewProject}
                    data-i18n-key="projects.newProject"
                  >
                    {t('projects.newProject')}
                  </Button>
                </Flex>
              )}
            </Flex>

            {projectsStatus === IDLE_STATUSES.pending ? (
              <Flex align="center" justify="center" className="flex-1">
                <Spin size="large" />
              </Flex>
            ) : filteredProjects.length === 0 ? (
              <Flex align="center" justify="center" className="flex-1">
                <Empty
                  description={
                    projects.length === 0 ? t('projects.empty') : t('projects.emptyFiltered')
                  }
                >
                  {projects.length === 0 && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleNewProject}
                      data-i18n-key="projects.newProject"
                    >
                      {t('projects.newProject')}
                    </Button>
                  )}
                </Empty>
              </Flex>
            ) : (
              <Flex wrap="wrap" gap="middle" justify="center" className="pb-md sm:justify-start!">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onOpen={handleOpen}
                    onDelete={handleDelete}
                    onRename={handleRenameStart}
                    isOpening={openingProjectId === project.id}
                  />
                ))}
              </Flex>
            )}
          </>
        ) : null}
      </Flex>

      <Suspense>
        <DeleteProjectModal
          project={deletingProject}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          confirmLoading={isDeleting}
        />
      </Suspense>

      {renamingProject && (
        <Suspense>
          <RenameProjectModal
            project={renamingProject}
            onConfirm={handleRenameConfirm}
            onCancel={handleRenameCancel}
          />
        </Suspense>
      )}
    </>
  );
};

export default ProjectsPage;
