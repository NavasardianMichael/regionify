import { type FC, lazy, Suspense, useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { DownloadOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Input, Modal, Spin, Splitter, Typography } from 'antd';
import { selectHasTimelineData } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import {
  selectCurrentProjectId,
  selectSetCurrentProjectId,
  selectSetSavedStateSnapshot,
} from '@/store/projects/selectors';
import { useProjectsStore } from '@/store/projects/store';
import { captureStateSnapshot } from '@/hooks/useProjectState';
import { useVisualizerPage } from '@/hooks/useVisualizerPage';
import { getProjectRoute, ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { resetVisualizerToDefaultState } from '@/helpers/applyFullTemporaryProjectState';
import { CardLayout } from '@/components/visualizer/CardLayout';
import GeneralStylesPack from '@/components/visualizer/GeneralStylesPack';
import ImportDataPanel from '@/components/visualizer/ImportDataPanel';
import LegendConfigPanel from '@/components/visualizer/LegendConfigPanel';
import LegendStylesPanel from '@/components/visualizer/LegendStylesPanel';
import MapStylesPanel from '@/components/visualizer/MapStylesPanel';
import MapViewer from '@/components/visualizer/MapViewer';
import { RegionSelect } from '@/components/visualizer/RegionSelect';

const ExportMapModal = lazy(() => import('@/components/visualizer/ExportMapModal'));
const AnimationControls = lazy(() => import('@/components/visualizer/AnimationControls'));

const VisualizerPage: FC = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const currentProjectId = useProjectsStore(selectCurrentProjectId);
  const setCurrentProjectId = useProjectsStore(selectSetCurrentProjectId);
  const setSavedStateSnapshot = useProjectsStore(selectSetSavedStateSnapshot);
  const hasTimelineData = useVisualizerStore(selectHasTimelineData);

  const {
    selectedCountryId,
    isExportModalOpen,
    isSaving,
    isNameModalOpen,
    projectName,
    isSaveDisabled,
    saveButtonText,
    exportButtonText,
    handleOpenExportModal,
    handleCloseExportModal,
    handleSave,
    handleCreateProject,
    handleNameModalCancel,
    handleNameChange,
  } = useVisualizerPage();

  useEffect(() => {
    if (location.pathname === ROUTES.PROJECT_NEW) {
      return;
    }
    if (currentProjectId && urlProjectId !== undefined && urlProjectId !== currentProjectId) {
      navigate(getProjectRoute(currentProjectId), { replace: true });
    } else if (!currentProjectId && urlProjectId && urlProjectId !== 'new') {
      navigate(ROUTES.PROJECT_NEW, { replace: true });
    }
  }, [currentProjectId, urlProjectId, navigate, location.pathname]);

  // Run before child useEffects (e.g. ImportDataPanel async region loader) so the store is cleared first.
  useLayoutEffect(() => {
    if (location.pathname !== ROUTES.PROJECT_NEW) return;
    resetVisualizerToDefaultState();
    setCurrentProjectId(null);
    requestAnimationFrame(() => {
      setSavedStateSnapshot(captureStateSnapshot());
    });
  }, [location.pathname, setCurrentProjectId, setSavedStateSnapshot]);

  return (
    <>
      <Splitter className="h-full min-h-0 w-full">
        <Splitter.Panel
          defaultSize="25%"
          min="15%"
          max="40%"
          collapsible={{ start: true, end: true, showCollapsibleIcon: true }}
        >
          <CardLayout component="aside" vertical className="h-full">
            <RegionSelect />
            <Divider />
            <ImportDataPanel />
            <Divider />
            <LegendConfigPanel />
          </CardLayout>
        </Splitter.Panel>

        <Splitter.Panel>
          <CardLayout className="min-h-md gap-md h-full">
            <Flex
              align="center"
              justify="space-between"
              wrap
              className="mb-sm shrink-0"
              gap="middle"
            >
              <Typography.Title level={3} className="text-primary mb-0! text-base font-semibold">
                {t('visualizer.mapAreaTitle')}
              </Typography.Title>
              <Flex gap="small">
                <Button
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  disabled={isSaveDisabled}
                  loading={isSaving}
                >
                  {saveButtonText}
                </Button>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleOpenExportModal}
                  disabled={!selectedCountryId}
                >
                  {exportButtonText}
                </Button>
              </Flex>
            </Flex>
            {hasTimelineData && (
              <Suspense>
                <AnimationControls />
              </Suspense>
            )}
            <Suspense fallback={<Spin className="m-auto flex-1" />}>
              <MapViewer className="min-h-0 flex-1" />
            </Suspense>
          </CardLayout>
        </Splitter.Panel>

        <Splitter.Panel
          defaultSize="25%"
          min="15%"
          max="35%"
          collapsible={{ start: true, end: false, showCollapsibleIcon: true }}
        >
          <CardLayout component="aside" vertical className="h-full">
            <MapStylesPanel />
            <Divider />
            <LegendStylesPanel />
            <Divider />
            <GeneralStylesPack />
          </CardLayout>
        </Splitter.Panel>
      </Splitter>

      {isExportModalOpen && (
        <Suspense>
          <ExportMapModal open={isExportModalOpen} onClose={handleCloseExportModal} />
        </Suspense>
      )}

      <Modal
        title={t('visualizer.saveModalTitle')}
        open={isNameModalOpen}
        onOk={handleCreateProject}
        onCancel={handleNameModalCancel}
        okText={t('visualizer.saveModalCreate')}
        okButtonProps={{ disabled: !projectName.trim() }}
      >
        <Flex vertical gap="small" className="py-sm">
          <Typography.Text>{t('visualizer.saveModalPrompt')}</Typography.Text>
          <Input
            placeholder={t('visualizer.saveModalPlaceholder')}
            value={projectName}
            onChange={handleNameChange}
            onPressEnter={handleCreateProject}
          />
        </Flex>
      </Modal>
    </>
  );
};

export default VisualizerPage;
