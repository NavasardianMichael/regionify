import { type FC, lazy, Suspense, useCallback, useState } from 'react';
import { DownloadOutlined, SaveOutlined } from '@ant-design/icons';
import { App, Button, Divider, Flex, Input, Modal, Spin, Splitter, Typography } from 'antd';

import { createProject, updateProject } from '@/api/projects';
import {
  captureStateSnapshot,
  getProjectPayload,
  useHasUnsavedChanges,
} from '@/hooks/useProjectState';
import { selectSelectedRegionId } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { selectIsLoggedIn } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import {
  selectAddProject,
  selectCurrentProjectId,
  selectSetCurrentProjectId,
  selectSetSavedStateSnapshot,
  selectUpdateProjectInList,
} from '@/store/projects/selectors';
import { useProjectsStore } from '@/store/projects/store';
import { REGION_OPTIONS } from '@/constants/regions';
import { CardLayout } from '@/components/visualizer/CardLayout';
import GeneralStylesPack from '@/components/visualizer/GeneralStylesPack';
import ImportDataPanel from '@/components/visualizer/ImportDataPanel';
import LegendConfigPanel from '@/components/visualizer/LegendConfigPanel';
import LegendStylesPanel from '@/components/visualizer/LegendStylesPanel';
import MapStylesPanel from '@/components/visualizer/MapStylesPanel';
import MapViewer from '@/components/visualizer/MapViewer';
import PictureStylesPanel from '@/components/visualizer/PictureStylesPanel';
import { RegionSelect } from '@/components/visualizer/RegionSelect';

const ExportMapModal = lazy(() => import('@/components/visualizer/ExportMapModal'));

const VisualizerPage: FC = () => {
  const { message } = App.useApp();
  const selectedRegionId = useVisualizerStore(selectSelectedRegionId);
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
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

  const handleOpenExportModal = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  const handleCloseExportModal = useCallback(() => {
    setIsExportModalOpen(false);
  }, []);

  const handleSave = useCallback(async () => {
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
      message.success('Project saved');
    } catch {
      message.error('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  }, [currentProjectId, selectedRegionId, updateProjectInList, setSavedStateSnapshot, message]);

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
      message.success('Project created');
      setProjectName('');
    } catch {
      message.error('Failed to create project');
    } finally {
      setIsSaving(false);
    }
  }, [projectName, addProject, setCurrentProjectId, setSavedStateSnapshot, message]);

  const handleNameModalCancel = useCallback(() => {
    setIsNameModalOpen(false);
    setProjectName('');
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
  }, []);

  const isSaveDisabled =
    !isLoggedIn || !selectedRegionId || (!!currentProjectId && !hasUnsavedChanges);

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
                  {currentProjectId ? 'Save' : 'Save As'}
                </Button>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleOpenExportModal}
                  disabled={!selectedRegionId}
                >
                  Export
                </Button>
              </Flex>
            </Flex>
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
            <PictureStylesPanel />
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
            autoFocus
          />
        </Flex>
      </Modal>
    </>
  );
};

export default VisualizerPage;
