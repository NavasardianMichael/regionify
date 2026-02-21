import { type FC, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Input, Spin, Typography } from 'antd';
import type { Project } from '@/api/projects/types';
import { useLoadProject } from '@/hooks/useLoadProject';
import { useProjects } from '@/hooks/useProjects';
import { getProjectRoute, ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { ProjectCard } from '@/components/projects/ProjectCard';

const RenameProjectModal = lazy(() => import('@/components/projects/RenameProjectModal'));

const ProjectsPage: FC = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const loadProject = useLoadProject();
  const {
    projects,
    filteredProjects,
    isLoading,
    search,
    renamingProject,
    newName,
    setSearch,
    handleDelete,
    handleRenameStart,
    handleRenameConfirm,
    handleRenameCancel,
    setNewName,
  } = useProjects();

  const handleOpen = useCallback(
    (project: Project) => {
      loadProject(project);
      navigate(getProjectRoute(project.id));
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
    navigate(ROUTES.PROJECT_NEW);
  }, [navigate]);

  return (
    <>
      <Flex vertical className="mx-auto h-full w-full" gap="middle">
        <Flex align="center" justify="space-between">
          <Typography.Title level={2} className="text-primary mb-0! text-xl font-bold">
            {t('projects.title')}
          </Typography.Title>
          <Flex gap="small">
            <Input.Search
              placeholder={t('projects.searchPlaceholder')}
              className="w-64"
              value={search}
              onChange={handleSearchChange}
              allowClear
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleNewProject}>
              {t('projects.newProject')}
            </Button>
          </Flex>
        </Flex>

        {isLoading ? (
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
                <Button type="primary" icon={<PlusOutlined />} onClick={handleNewProject}>
                  {t('projects.newProject')}
                </Button>
              )}
            </Empty>
          </Flex>
        ) : (
          <Flex wrap="wrap" gap="middle" className="pb-md overflow-y-auto">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={handleOpen}
                onDelete={handleDelete}
                onRename={handleRenameStart}
              />
            ))}
          </Flex>
        )}
      </Flex>

      {renamingProject && (
        <Suspense>
          <RenameProjectModal
            project={renamingProject}
            name={newName}
            onNameChange={setNewName}
            onConfirm={handleRenameConfirm}
            onCancel={handleRenameCancel}
          />
        </Suspense>
      )}
    </>
  );
};

export default ProjectsPage;
