import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLAN_DETAILS, PLANS } from '@regionify/shared';
import { createProject, deleteProject as deleteProjectApi, updateProject } from '@/api/projects';
import { useLegendDataStore } from '@/store/legendData/store';
import { useLegendStylesStore } from '@/store/legendStyles/store';
import { selectSelectedCountryId } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { useMapStylesStore } from '@/store/mapStyles/store';
import { selectIsLoggedIn, selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import {
  selectAddProject,
  selectCurrentProject,
  selectCurrentProjectId,
  selectRemoveProject,
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
    google: visualizerState.google,
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
  const { message, modal } = useAppFeedback();
  const navigate = useNavigate();
  const selectedCountryId = useVisualizerStore(selectSelectedCountryId);
  const isLoggedIn = useProfileStore(selectIsLoggedIn);
  const user = useProfileStore(selectUser);
  const currentProjectId = useProjectsStore(selectCurrentProjectId);
  const currentProject = useProjectsStore(selectCurrentProject);
  const setCurrentProjectId = useProjectsStore(selectSetCurrentProjectId);
  const setSavedStateSnapshot = useProjectsStore(selectSetSavedStateSnapshot);
  const addProject = useProjectsStore(selectAddProject);
  const updateProjectInList = useProjectsStore(selectUpdateProjectInList);
  const removeProject = useProjectsStore(selectRemoveProject);
  const hasUnsavedChanges = useHasUnsavedChanges();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [isRenameSubmitting, setIsRenameSubmitting] = useState(false);

  const isFreePlan = useMemo(() => !user || user.plan === PLANS.observer, [user]);

  const canUseEmbed = useMemo(() => {
    const plan = user?.plan;
    if (!plan) return false;
    return PLAN_DETAILS[plan]?.limits.publicEmbed === true;
  }, [user?.plan]);

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

  const handleOpenEmbedModal = useCallback(() => {
    if (!canUseEmbed) return;
    if (!isLoggedIn) {
      const fullCurrent = buildFullTemporaryState();
      saveTemporaryProjectState(buildPartialTemporaryState(fullCurrent));
      saveReturnUrl(window.location.pathname);
      navigate(ROUTES.LOGIN);
      return;
    }
    if (!currentProjectId) return;
    setIsEmbedModalOpen(true);
  }, [canUseEmbed, isLoggedIn, currentProjectId, navigate]);

  const handleCloseEmbedModal = useCallback(() => {
    setIsEmbedModalOpen(false);
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

  const handleOpenRenameModal = useCallback(() => {
    if (!currentProject) return;
    setRenameName(currentProject.name);
    setIsRenameModalOpen(true);
  }, [currentProject]);

  const handleRenameModalCancel = useCallback(() => {
    setIsRenameModalOpen(false);
    setRenameName('');
  }, []);

  const handleRenameModalConfirm = useCallback(async () => {
    if (!currentProjectId || !currentProject) return;
    const trimmed = renameName.trim();
    if (!trimmed || trimmed === currentProject.name) {
      handleRenameModalCancel();
      return;
    }
    setIsRenameSubmitting(true);
    try {
      const updated = await updateProject(currentProjectId, { name: trimmed });
      updateProjectInList(updated);
      message.success(t('messages.projectRenamed'), 5);
      setIsRenameModalOpen(false);
      setRenameName('');
    } catch {
      message.error(t('messages.projectRenameFailed'), 0);
    } finally {
      setIsRenameSubmitting(false);
    }
  }, [
    currentProjectId,
    currentProject,
    renameName,
    updateProjectInList,
    message,
    t,
    handleRenameModalCancel,
  ]);

  const setRenameNameValue = useCallback((value: string) => {
    setRenameName(value);
  }, []);

  const handleDeleteCurrentProject = useCallback(() => {
    if (!currentProject) return;
    modal.confirm({
      centered: true,
      maskClosable: false,
      title: t('messages.deleteProjectTitle'),
      icon: null,
      content: t('messages.deleteProjectContent', { name: currentProject.name }),
      okText: t('messages.deleteProjectOk'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteProjectApi(currentProject.id);
          removeProject(currentProject.id);
          message.success(t('messages.projectDeleted'), 5);
          navigate(ROUTES.PROJECTS);
        } catch {
          message.error(t('messages.projectDeleteFailed'), 0);
        }
      },
    });
  }, [currentProject, modal, removeProject, message, t, navigate]);

  const isSaveDisabled = !selectedCountryId || (!!currentProjectId && !hasUnsavedChanges);

  const saveButtonText = useMemo(() => {
    if (isFreePlan && !isLoggedIn) return t('visualizer.saveLoginToSave');
    return currentProjectId ? t('visualizer.save') : t('visualizer.saveAs');
  }, [isFreePlan, isLoggedIn, currentProjectId, t]);

  const exportButtonText = useMemo(
    () => (isLoggedIn ? t('visualizer.export') : t('visualizer.loginToExport')),
    [isLoggedIn, t],
  );

  const embedButtonText = useMemo(
    () => (isLoggedIn ? t('visualizer.embed.openButton') : t('visualizer.loginToExport')),
    [isLoggedIn, t],
  );

  return {
    selectedCountryId,
    currentProject,
    hasUnsavedChanges,
    isLoggedIn,
    canUseEmbed,
    isExportModalOpen,
    isEmbedModalOpen,
    isSaving,
    isNameModalOpen,
    projectName,
    isRenameModalOpen,
    renameName,
    isRenameSubmitting,
    isSaveDisabled,
    saveButtonText,
    exportButtonText,
    embedButtonText,
    handleOpenExportModal,
    handleCloseExportModal,
    handleOpenEmbedModal,
    handleCloseEmbedModal,
    handleSave,
    handleCreateProject,
    handleNameModalCancel,
    handleNameChange,
    handleOpenRenameModal,
    handleRenameModalCancel,
    handleRenameModalConfirm,
    setRenameNameValue,
    handleDeleteCurrentProject,
  };
}
