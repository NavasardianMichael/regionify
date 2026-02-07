import { memo, useCallback } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { Button, Card, Flex, Typography } from 'antd';
import type { Project } from '@/api/projects/types';

type Props = {
  project: Project;
  onOpen: (project: Project) => void;
  onDelete: (project: Project) => void;
  onRename: (project: Project) => void;
};

const ProjectCard = memo<Props>(({ project, onOpen, onDelete, onRename }) => {
  const handleOpenClick = useCallback(() => {
    onOpen(project);
  }, [onOpen, project]);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(project);
    },
    [onDelete, project],
  );

  const handleRenameClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRename(project);
    },
    [onRename, project],
  );

  const regionLabel = project.selectedRegionId
    ? project.selectedRegionId.replace(/([A-Z])/g, ' $1').trim()
    : 'No region';

  const updatedAt = new Date(project.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card
      className="w-72 cursor-pointer shadow-sm transition-shadow hover:shadow-md"
      onClick={handleOpenClick}
      actions={[
        <Button key="rename" type="text" icon={<EditOutlined />} onClick={handleRenameClick}>
          Rename
        </Button>,
        <Button
          key="delete"
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={handleDeleteClick}
        >
          Delete
        </Button>,
      ]}
    >
      <Flex vertical gap="small">
        <Flex align="center" gap="small" className="min-w-0">
          <FolderOpenOutlined className="text-primary shrink-0 text-lg" />
          <Typography.Text strong className="truncate">
            {project.name}
          </Typography.Text>
        </Flex>

        <Flex align="center" gap="small">
          <GlobalOutlined className="shrink-0 text-gray-400" />
          <Typography.Text type="secondary" className="truncate text-xs capitalize">
            {regionLabel}
          </Typography.Text>
        </Flex>

        <Typography.Text type="secondary" className="text-xs">
          {updatedAt}
        </Typography.Text>
      </Flex>
    </Card>
  );
});

ProjectCard.displayName = 'ProjectCard';

export { ProjectCard };
