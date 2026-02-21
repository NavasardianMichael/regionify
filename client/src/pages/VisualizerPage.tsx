import { type FC, lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DownloadOutlined, SaveOutlined } from '@ant-design/icons';
import { PLANS } from '@regionify/shared';
import { App, Button, Divider, Flex, Input, Modal, Spin, Splitter, Typography } from 'antd';
import { createProject, updateProject } from '@/api/projects';
import { useLegendDataStore } from '@/store/legendData/store';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { selectHasTimelineData, selectSelectedRegionId } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectIsLoggedIn, selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import {
  selectAddProject,
  selectCurrentProjectId,
  selectSetCurrentProjectId,
  selectSetSavedStateSnapshot,
  selectUpdateProjectInList,
} from '@/store/projects/selectors';
import { useProjectsStore } from '@/store/projects/store';
import {
  captureStateSnapshot,
  getProjectPayload,
  useHasUnsavedChanges,
} from '@/hooks/useProjectState';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { REGION_OPTIONS } from '@/constants/regions';
import { getProjectRoute, ROUTES } from '@/constants/routes';
import {
  buildPartialTemporaryState,
  type FullTemporaryProjectState,
  saveReturnUrl,
  saveTemporaryProjectState,
} from '@/helpers/temporaryProjectState';
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
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const selectedRegionId = useVisualizerStore(selectSelectedRegionId);
  const hasTimelineData = useVisualizerStore(selectHasTimelineData);
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const user = useProfileStore(selectUser);
  const currentProjectId = useProjectsStore(selectCurrentProjectId);
  const setCurrentProjectId = useProjectsStore(selectSetCurrentProjectId);
  const setSavedStateSnapshot = useProjectsStore(selectSetSavedStateSnapshot);
  const addProject = useProjectsStore(selectAddProject);
  const updateProjectInList = useProjectsStore(selectUpdateProjectInList);
  const hasUnsavedChanges = useHasUnsavedChanges();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');

  // Determine if user is on free plan
  const isFreePlan = useMemo(() => {
    return !user || user.plan === PLANS.observer;
  }, [user]);

  // Sync URL with project state
  useEffect(() => {
    if (currentProjectId && urlProjectId !== currentProjectId) {
      navigate(getProjectRoute(currentProjectId), { replace: true });
    } else if (!currentProjectId && urlProjectId && urlProjectId !== 'new') {
      // If URL has projectId but store doesn't, navigate to new
      navigate(ROUTES.PROJECT_NEW, { replace: true });
    }
  }, [currentProjectId, urlProjectId, navigate]);

  const handleOpenExportModal = useCallback(() => {
    if (!isLoggedIn) {
      const visualizerState = useVisualizerStore.getState();
      const mapStylesState = useMapStylesStore.getState();
      const legendStylesState = useLegendStylesStore.getState();
      const legendDataState = useLegendDataStore.getState();

      const fullCurrent: FullTemporaryProjectState = {
        selectedRegionId: visualizerState.selectedRegionId ?? null,
        importDataType: visualizerState.importDataType,
        data: visualizerState.data,
        timelineData: visualizerState.timelineData,
        timePeriods: visualizerState.timePeriods,
        activeTimePeriod: visualizerState.activeTimePeriod,
        border: mapStylesState.border,
        shadow: mapStylesState.shadow,
        zoomControls: mapStylesState.zoomControls,
        picture: mapStylesState.picture,
        regionLabels: mapStylesState.regionLabels,
        labels: legendStylesState.labels,
        title: legendStylesState.title,
        position: legendStylesState.position,
        floatingPosition: legendStylesState.floatingPosition,
        floatingSize: legendStylesState.floatingSize,
        backgroundColor: legendStylesState.backgroundColor,
        noDataColor: legendStylesState.noDataColor,
        items: legendDataState.items,
      };
      const partial = buildPartialTemporaryState(fullCurrent);
      saveTemporaryProjectState(partial);
      saveReturnUrl(window.location.pathname);
      navigate(ROUTES.LOGIN);
      return;
    }
    setIsExportModalOpen(true);
  }, [isLoggedIn, navigate]);

  const handleCloseExportModal = useCallback(() => {
    setIsExportModalOpen(false);
  }, []);

  const handleSave = useCallback(async () => {
    // For free users, if not logged in, redirect to login with state saved
    if (isFreePlan && !isLoggedIn) {
      const visualizerState = useVisualizerStore.getState();
      const mapStylesState = useMapStylesStore.getState();
      const legendStylesState = useLegendStylesStore.getState();
      const legendDataState = useLegendDataStore.getState();

      const fullCurrent: FullTemporaryProjectState = {
        selectedRegionId: visualizerState.selectedRegionId ?? null,
        importDataType: visualizerState.importDataType,
        data: visualizerState.data,
        timelineData: visualizerState.timelineData,
        timePeriods: visualizerState.timePeriods,
        activeTimePeriod: visualizerState.activeTimePeriod,
        border: mapStylesState.border,
        shadow: mapStylesState.shadow,
        zoomControls: mapStylesState.zoomControls,
        picture: mapStylesState.picture,
        regionLabels: mapStylesState.regionLabels,
        labels: legendStylesState.labels,
        title: legendStylesState.title,
        position: legendStylesState.position,
        floatingPosition: legendStylesState.floatingPosition,
        floatingSize: legendStylesState.floatingSize,
        backgroundColor: legendStylesState.backgroundColor,
        noDataColor: legendStylesState.noDataColor,
        items: legendDataState.items,
      };
      const partial = buildPartialTemporaryState(fullCurrent);
      saveTemporaryProjectState(partial);
      saveReturnUrl(window.location.pathname);
      navigate(ROUTES.LOGIN);
      return;
    }

    if (!currentProjectId) {
      const regionLabel = REGION_OPTIONS.find((r) => r.value === selectedRegionId)?.label ?? '';
      setProjectName(String(regionLabel));
      setIsNameModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      const payload = getProjectPayload();
      const updated = await updateProject(currentProjectId, payload);
      updateProjectInList(updated);
      setSavedStateSnapshot(captureStateSnapshot());
      message.success(t('messages.projectSaved'), 5);
    } catch {
      message.error(t('messages.projectSaveFailed'), 0);
    } finally {
      setIsSaving(false);
    }
  }, [
    isFreePlan,
    isLoggedIn,
    currentProjectId,
    selectedRegionId,
    updateProjectInList,
    setSavedStateSnapshot,
    message,
    navigate,
    t,
  ]);

  const handleCreateProject = useCallback(async () => {
    if (!projectName.trim()) return;

    setIsSaving(true);
    setIsNameModalOpen(false);
    try {
      const payload = getProjectPayload(projectName.trim());
      const created = await createProject(payload);
      addProject(created);
      setCurrentProjectId(created.id);
      setSavedStateSnapshot(captureStateSnapshot());
      // Update URL to reflect new project ID
      navigate(getProjectRoute(created.id), { replace: true });
      message.success(t('messages.projectCreated'), 5);
      setProjectName('');
    } catch {
      message.error(t('messages.projectCreateFailed'), 0);
    } finally {
      setIsSaving(false);
    }
  }, [projectName, addProject, setCurrentProjectId, setSavedStateSnapshot, message, navigate, t]);

  const handleNameModalCancel = useCallback(() => {
    setIsNameModalOpen(false);
    setProjectName('');
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
  }, []);

  const isSaveDisabled = !selectedRegionId || (!!currentProjectId && !hasUnsavedChanges);

  const saveButtonText = useMemo(() => {
    if (isFreePlan && !isLoggedIn) {
      return 'Login to Save';
    }
    return currentProjectId ? 'Save' : 'Save As';
  }, [isFreePlan, isLoggedIn, currentProjectId]);

  const exportButtonText = useMemo(() => {
    return isLoggedIn ? 'Export' : 'Login to Export';
  }, [isLoggedIn]);

  return (
    <>
      <Splitter className="h-full min-h-0 w-full">
        {/* Left Sidebar */}
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

        {/* Center Content */}
        <Splitter.Panel>
          <CardLayout className="min-h-md gap-md h-full">
            <Flex align="center" justify="space-between" className="mb-sm shrink-0" gap="middle">
              <Typography.Title level={3} className="text-primary mb-0! text-base font-semibold">
                Map Visualization
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
                  disabled={!selectedRegionId}
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

        {/* Right Sidebar */}
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

      {/* Export Modal */}
      {isExportModalOpen && (
        <Suspense>
          <ExportMapModal open={isExportModalOpen} onClose={handleCloseExportModal} />
        </Suspense>
      )}

      {/* Project Name Modal */}
      <Modal
        title="Save Project"
        open={isNameModalOpen}
        onOk={handleCreateProject}
        onCancel={handleNameModalCancel}
        okText="Create"
        okButtonProps={{ disabled: !projectName.trim() }}
      >
        <Flex vertical gap="small" className="py-sm">
          <Typography.Text>Enter a name for your project:</Typography.Text>
          <Input
            placeholder="My Map Project"
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
