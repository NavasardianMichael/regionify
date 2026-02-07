import { type FC, lazy, Suspense, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Input, Spin, Typography } from 'antd';
import type { Project } from '@/api/projects/types';
import { useLoadProject } from '@/hooks/useLoadProject';
import { useProjects } from '@/hooks/useProjects';
import { ROUTES } from '@/constants/routes';
import { ProjectCard } from '@/components/projects/ProjectCard';

const RenameProjectModal = lazy(() => import('@/components/projects/RenameProjectModal'));

const ProjectsPage: FC = () => {
  const navigate = useNavigate();
  const loadProject = useLoadProject();
  const {
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
  } = useProjects();

  const handleOpen = useCallback(
    (project: Project) => {
      loadProject(project);
      navigate(ROUTES.PROJECT_EDITOR);
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
    navigate(ROUTES.PROJECT_EDITOR);
  }, [navigate]);

  if (!isLoggedIn) {
    return (
      <Flex vertical align="center" justify="center" className="h-full w-full" gap="middle">
        <Empty description="Please log in to view your projects" />
        <Button type="primary" onClick={() => navigate(ROUTES.LOGIN)}>
          Log In
        </Button>
      </Flex>
    );
  }

  return (
    <>
      <Flex vertical className="mx-auto h-full w-full" gap="middle">
        <Flex align="center" justify="space-between">
          <Typography.Title level={2} className="text-primary mb-0! text-xl font-bold">
            My Projects
          </Typography.Title>
          <Flex gap="small">
            <Input.Search
              placeholder="Search projects..."
              className="w-64"
              value={search}
              onChange={handleSearchChange}
              allowClear
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleNewProject}>
              New Project
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
                projects.length === 0
                  ? 'No projects yet. Create your first map visualization!'
                  : 'No projects match your search'
              }
            >
              {projects.length === 0 && (
                <Button type="primary" icon={<PlusOutlined />} onClick={handleNewProject}>
                  Create Project
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
