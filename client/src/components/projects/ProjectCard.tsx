import { memo, type ReactNode, useCallback, useMemo } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  InsertRowAboveOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Flex, Spin, Typography } from 'antd';
import type { Project } from '@/api/projects/types';
import { useMapThumbnail } from '@/hooks/useMapThumbnail';
import type { ImportDataType } from '@/types/mapData';
import { IMPORT_FORMAT_LABEL_I18N_KEYS, PROJECT_DATE_FORMAT_OPTIONS } from '@/constants/data';
import type { TypedT } from '@/i18n/useTypedTranslation';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { getLocalizedRegionLabel } from '@/helpers/regionDisplay';
import { Card, CardMeta } from '@/components/ui/Card';

type ProjectCardProps = {
  project: Project;
  onOpen: (project: Project) => void;
  onDelete: (project: Project) => void;
  onRename: (project: Project) => void;
  isOpening?: boolean;
};

type ProjectCardCoverProps = {
  mapThumbnailUrl: string;
  thumbnailAlt: string;
};

const ProjectCardCover = memo<ProjectCardCoverProps>(({ mapThumbnailUrl, thumbnailAlt }) => (
  // Card cover sets direct children to `display:block`, so flex must be forced to center the image.
  <Flex align="center" justify="center" className="flex! h-36 w-full min-w-0 bg-gray-50 px-4">
    <img
      src={mapThumbnailUrl}
      alt={thumbnailAlt}
      className="max-h-30 w-auto max-w-full shrink-0 object-contain"
    />
  </Flex>
));
ProjectCardCover.displayName = 'ProjectCardCover';

const ProjectCardCoverLoading = memo(() => (
  <Flex
    align="center"
    justify="center"
    className="flex! h-36 w-full min-w-0 bg-gray-50 px-4"
    aria-busy
    aria-live="polite"
  >
    <Spin size="large" />
  </Flex>
));
ProjectCardCoverLoading.displayName = 'ProjectCardCoverLoading';

type ProjectCardMetaDescriptionProps = {
  countryLabel: string;
  dataSourceLine: string;
  createdLine: string;
  updatedLine: string;
};

const ProjectCardMetaDescription = memo<ProjectCardMetaDescriptionProps>(
  ({ countryLabel, dataSourceLine, createdLine, updatedLine }) => (
    <Flex vertical gap={4} className="min-w-0">
      <Flex align="center" gap="small" className="min-w-0">
        <GlobalOutlined className="shrink-0 text-xs text-gray-400" aria-hidden />
        <Typography.Text type="secondary" className="truncate text-xs">
          {countryLabel}
        </Typography.Text>
      </Flex>
      <Flex align="center" gap="small" className="min-w-0">
        <InsertRowAboveOutlined className="shrink-0 text-xs text-gray-400" aria-hidden />
        <Typography.Text type="secondary" className="truncate text-xs">
          {dataSourceLine}
        </Typography.Text>
      </Flex>
      <Typography.Text type="secondary" className="text-xs">
        {createdLine}
      </Typography.Text>
      <Typography.Text type="secondary" className="text-xs">
        {updatedLine}
      </Typography.Text>
    </Flex>
  ),
);
ProjectCardMetaDescription.displayName = 'ProjectCardMetaDescription';

type ProjectCardMetaSectionProps = {
  projectName: string;
  description: ReactNode;
};

const ProjectCardMetaSection = memo<ProjectCardMetaSectionProps>(({ projectName, description }) => (
  <CardMeta
    className="min-h-0"
    avatar={<Avatar icon={<FolderOpenOutlined aria-hidden />} className="shrink-0" />}
    title={
      <Typography.Text strong className="block truncate text-base">
        {projectName}
      </Typography.Text>
    }
    description={description}
  />
));
ProjectCardMetaSection.displayName = 'ProjectCardMetaSection';

type ProjectCardRenameButtonProps = {
  onClick: (e: React.MouseEvent) => void;
  label: string;
};

const ProjectCardRenameButton = memo<ProjectCardRenameButtonProps>(({ onClick, label }) => (
  <Button type="text" icon={<EditOutlined />} onClick={onClick}>
    {label}
  </Button>
));
ProjectCardRenameButton.displayName = 'ProjectCardRenameButton';

type ProjectCardDeleteButtonProps = {
  onClick: (e: React.MouseEvent) => void;
  label: string;
};

const ProjectCardDeleteButton = memo<ProjectCardDeleteButtonProps>(({ onClick, label }) => (
  <Button type="text" danger icon={<DeleteOutlined />} onClick={onClick}>
    {label}
  </Button>
));
ProjectCardDeleteButton.displayName = 'ProjectCardDeleteButton';

function datasetFormatLabel(t: TypedT, importDataType: ImportDataType | null | undefined): string {
  if (importDataType == null) {
    return t('projects.dataSourceNone');
  }
  return t(IMPORT_FORMAT_LABEL_I18N_KEYS[importDataType]);
}

const ProjectCard = memo<ProjectCardProps>(
  ({ project, onOpen, onDelete, onRename, isOpening = false }) => {
    const { t, i18n } = useTypedTranslation();

    const handleOpenClick = useCallback(() => {
      if (isOpening) return;
      onOpen(project);
    }, [isOpening, onOpen, project]);

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

    const dateLocale = i18n.resolvedLanguage ?? i18n.language;

    const countryLabel = useMemo(() => {
      if (!project.countryId) {
        return t('projects.cardNoCountry');
      }
      return getLocalizedRegionLabel(project.countryId, dateLocale) ?? t('projects.cardNoCountry');
    }, [dateLocale, project.countryId, t]);

    const { url: mapThumbnailUrl, isLoading: isThumbnailLoading } = useMapThumbnail(
      project.countryId,
    );

    const createdDateStr = useMemo(
      () => new Date(project.createdAt).toLocaleDateString(dateLocale, PROJECT_DATE_FORMAT_OPTIONS),
      [dateLocale, project.createdAt],
    );

    const updatedDateStr = useMemo(
      () => new Date(project.updatedAt).toLocaleDateString(dateLocale, PROJECT_DATE_FORMAT_OPTIONS),
      [dateLocale, project.updatedAt],
    );

    const dataSourceLine = useMemo(() => {
      if (!project.dataset) {
        return t('projects.dataSource', { type: t('projects.dataSourceNone') });
      }
      const typeLabel = datasetFormatLabel(t, project.dataset.importDataType);
      return t('projects.dataSource', { type: typeLabel });
    }, [project.dataset, t]);

    const createdLine = useMemo(
      () => t('projects.cardCreated', { date: createdDateStr }),
      [createdDateStr, t],
    );

    const updatedLine = useMemo(
      () => t('projects.cardUpdated', { date: updatedDateStr }),
      [t, updatedDateStr],
    );

    const actions = useMemo(
      () => [
        <ProjectCardRenameButton
          key="rename"
          onClick={handleRenameClick}
          label={t('common.rename')}
        />,
        <ProjectCardDeleteButton
          key="delete"
          onClick={handleDeleteClick}
          label={t('common.delete')}
        />,
      ],
      [handleRenameClick, handleDeleteClick, t],
    );

    return (
      <Card
        hoverable
        className="w-full sm:max-w-80"
        classNames={{ root: 'border-gray-300 border' }}
        cover={
          isThumbnailLoading || isOpening ? (
            <ProjectCardCoverLoading />
          ) : mapThumbnailUrl ? (
            <ProjectCardCover
              mapThumbnailUrl={mapThumbnailUrl}
              thumbnailAlt={t('projects.cardRegionThumbnailAlt')}
            />
          ) : undefined
        }
        actions={actions}
        onClick={handleOpenClick}
      >
        <ProjectCardMetaSection
          projectName={project.name}
          description={
            <ProjectCardMetaDescription
              countryLabel={countryLabel}
              dataSourceLine={dataSourceLine}
              createdLine={createdLine}
              updatedLine={updatedLine}
            />
          }
        />
      </Card>
    );
  },
);

ProjectCard.displayName = 'ProjectCard';

export { ProjectCard };
