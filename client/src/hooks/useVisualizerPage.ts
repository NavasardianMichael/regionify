import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLANS } from '@regionify/shared';
import { createProject, updateProject } from '@/api/projects';
import { useLegendDataStore } from '@/store/legendData/store';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { selectSelectedCountryId } from '@/store/mapData/selectors';
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
import { REGION_OPTIONS } from '@/constants/regions';
import { getProjectRoute, ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import {
  buildPartialTemporaryState,
  type FullTemporaryProjectState,
  saveReturnUrl,
  saveTemporaryProjectState,
} from '@/helpers/temporaryProjectState';
import { useAppFeedback } from '@/components/shared/useAppFeedback';

function buildFullTemporaryState(): FullTemporaryProjectState {
  const visualizerState = useVisualizerStore.getState();
  const mapStylesState = useMapStylesStore.getState();
  const legendStylesState = useLegendStylesStore.getState();
  const legendDataState = useLegendDataStore.getState();
  return {
    selectedCountryId: visualizerState.selectedCountryId ?? null,
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
}

export function useVisualizerPage() {
  const { t } = useTypedTranslation();
  const { message } = useAppFeedback();
  const navigate = useNavigate();
  const selectedCountryId = useVisualizerStore(selectSelectedCountryId);
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

  const isFreePlan = useMemo(() => !user || user.plan === PLANS.observer, [user]);

  const handleOpenExportModal = useCallback(() => {
    if (!isLoggedIn) {
      const fullCurrent = buildFullTemporaryState();
      saveTemporaryProjectState(buildPartialTemporaryState(fullCurrent));
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
    if (isFreePlan && !isLoggedIn) {
      saveTemporaryProjectState(buildPartialTemporaryState(buildFullTemporaryState()));
      saveReturnUrl(window.location.pathname);
      navigate(ROUTES.LOGIN);
      return;
    }

    if (!currentProjectId) {
      const regionLabel = REGION_OPTIONS.find((r) => r.value === selectedCountryId)?.label ?? '';
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
    selectedCountryId,
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

  const isSaveDisabled = !selectedCountryId || (!!currentProjectId && !hasUnsavedChanges);

  const saveButtonText = useMemo(() => {
    if (isFreePlan && !isLoggedIn) return t('visualizer.saveLoginToSave');
    return currentProjectId ? t('visualizer.save') : t('visualizer.saveAs');
  }, [isFreePlan, isLoggedIn, currentProjectId, t]);

  const exportButtonText = useMemo(
    () => (isLoggedIn ? t('visualizer.export') : t('visualizer.loginToExport')),
    [isLoggedIn, t],
  );

  return {
    selectedCountryId,
    hasUnsavedChanges,
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
  };
}
