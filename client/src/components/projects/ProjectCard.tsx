import { memo, useCallback, useMemo } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import type { Project } from '@/api/projects/types';
import { useMapThumbnail } from '@/hooks/useMapThumbnail';
import { COUNTRY_ID_SPLIT_REGEX, PROJECT_DATE_FORMAT_OPTIONS } from '@/constants/data';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { Card } from '@/components/ui/Card';

type Props = {
  project: Project;
  onOpen: (project: Project) => void;
  onDelete: (project: Project) => void;
  onRename: (project: Project) => void;
};

const ProjectCard = memo<Props>(({ project, onOpen, onDelete, onRename }) => {
  const { t } = useTypedTranslation();

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

  const countryLabel = project.countryId
    ? project.countryId.replace(COUNTRY_ID_SPLIT_REGEX, ' $1').trim()
    : t('projects.cardNoCountry');

  const mapThumbnail = useMapThumbnail(project.countryId);

  const updatedAt = new Date(project.updatedAt).toLocaleDateString(
    'en-US',
    PROJECT_DATE_FORMAT_OPTIONS,
  );

  const actions = useMemo(
    () => [
      <Button key="rename" type="text" icon={<EditOutlined />} onClick={handleRenameClick}>
        {t('common.rename')}
      </Button>,
      <Button key="delete" type="text" danger icon={<DeleteOutlined />} onClick={handleDeleteClick}>
        {t('common.delete')}
      </Button>,
    ],
    [handleRenameClick, handleDeleteClick, t],
  );

  return (
    <Card
      className="w-full cursor-pointer shadow-sm transition-shadow hover:shadow-md sm:max-w-72"
      onClick={handleOpenClick}
      actions={actions}
    >
      <Flex align="center" gap="middle">
        <Flex vertical gap="small" className="min-w-0 flex-1">
          <Flex align="center" gap="small" className="min-w-0">
            <FolderOpenOutlined className="text-primary shrink-0 text-lg" />
            <Typography.Text strong className="truncate">
              {project.name}
            </Typography.Text>
          </Flex>

          <Flex align="center" gap="small">
            <GlobalOutlined className="shrink-0 text-gray-400" />
            <Typography.Text type="secondary" className="truncate text-xs capitalize">
              {countryLabel}
            </Typography.Text>
          </Flex>

          <Typography.Text type="secondary" className="text-xs">
            {updatedAt}
          </Typography.Text>
        </Flex>

        {mapThumbnail && (
          <img
            src={mapThumbnail}
            alt=""
            className="pointer-events-none h-16 w-16 shrink-0 object-contain opacity-20"
          />
        )}
      </Flex>
    </Card>
  );
});

ProjectCard.displayName = 'ProjectCard';

export { ProjectCard };
