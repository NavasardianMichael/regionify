import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLAN_DETAILS, PLANS } from '@regionify/shared';
import { createProject, deleteProject as deleteProjectApi, updateProject } from '@/api/projects';
import { selectSelectedCountryId } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
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
import { getProjectRoute, ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { captureFullTemporaryProjectState } from '@/helpers/captureFullTemporaryProjectState';
import { getLocalizedRegionLabel } from '@/helpers/regionDisplay';
import {
  buildPartialTemporaryState,
  clearTemporaryProjectState,
  saveReturnUrl,
  saveTemporaryProjectState,
} from '@/helpers/temporaryProjectState';
import { useAppFeedback } from '@/components/shared/useAppFeedback';

export function useVisualizerPage() {
  const { t, i18n } = useTypedTranslation();
  const { message } = useAppFeedback();
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
  const [isRenameSubmitting, setIsRenameSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const isFreePlan = useMemo(() => !user || user.plan === PLANS.observer, [user]);

  const canUseEmbed = useMemo(() => {
    const plan = user?.plan;
    if (!plan) return false;
    return PLAN_DETAILS[plan]?.limits.publicEmbed === true;
  }, [user?.plan]);

  const handleOpenExportModal = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  const handleCloseExportModal = useCallback(() => {
    setIsExportModalOpen(false);
  }, []);

  const handleOpenEmbedModal = useCallback(() => {
    if (!canUseEmbed) return;
    if (!isLoggedIn) {
      const fullCurrent = captureFullTemporaryProjectState();
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

  /**
   * Silently saves an existing project (no modals, no redirects).
   * Returns `true` on success, `false` on failure or when the project hasn't been created yet.
   */
  const saveCurrentProject = useCallback(async (): Promise<boolean> => {
    if (!currentProjectId) return false;
    try {
      const payload = getProjectPayload();
      const updated = await updateProject(currentProjectId, payload);
      updateProjectInList(updated);
      setSavedStateSnapshot(captureStateSnapshot());
      clearTemporaryProjectState();
      message.success(t('messages.projectSaved'), 5);
      return true;
    } catch {
      message.error(t('messages.projectSaveFailed'), 0);
      return false;
    }
  }, [currentProjectId, updateProjectInList, setSavedStateSnapshot, message, t]);

  const handleSave = useCallback(async () => {
    if (isFreePlan && !isLoggedIn) {
      saveTemporaryProjectState(buildPartialTemporaryState(captureFullTemporaryProjectState()));
      saveReturnUrl(window.location.pathname);
      navigate(ROUTES.LOGIN);
      return;
    }

    if (!currentProjectId) {
      const locale = i18n.resolvedLanguage ?? i18n.language;
      const regionLabel =
        selectedCountryId != null ? (getLocalizedRegionLabel(selectedCountryId, locale) ?? '') : '';
      setProjectName(String(regionLabel));
      setIsNameModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      await saveCurrentProject();
    } finally {
      setIsSaving(false);
    }
  }, [
    isFreePlan,
    isLoggedIn,
    currentProjectId,
    selectedCountryId,
    i18n.language,
    i18n.resolvedLanguage,
    saveCurrentProject,
    navigate,
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
      clearTemporaryProjectState();
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
    setIsRenameModalOpen(true);
  }, [currentProject]);

  const handleRenameModalCancel = useCallback(() => {
    setIsRenameModalOpen(false);
  }, []);

  const handleRenameModalConfirm = useCallback(
    async (trimmed: string) => {
      if (!currentProjectId || !currentProject) return;
      setIsRenameSubmitting(true);
      try {
        const updated = await updateProject(currentProjectId, { name: trimmed });
        updateProjectInList(updated);
        message.success(t('messages.projectRenamed'), 5);
        setIsRenameModalOpen(false);
      } catch {
        message.error(t('messages.projectRenameFailed'), 0);
      } finally {
        setIsRenameSubmitting(false);
      }
    },
    [currentProjectId, currentProject, updateProjectInList, message, t],
  );

  const handleDeleteCurrentProject = useCallback(() => {
    if (!currentProject) return;
    setIsDeleteModalOpen(true);
  }, [currentProject]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!currentProject) return;
    setIsDeleteSubmitting(true);
    try {
      await deleteProjectApi(currentProject.id);
      removeProject(currentProject.id);
      message.success(t('messages.projectDeleted'), 5);
      setIsDeleteModalOpen(false);
      navigate(ROUTES.PROJECTS);
    } catch {
      message.error(t('messages.projectDeleteFailed'), 0);
    } finally {
      setIsDeleteSubmitting(false);
    }
  }, [currentProject, removeProject, message, t, navigate]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteModalOpen(false);
  }, []);

  const isSaveDisabled = !selectedCountryId || (!!currentProjectId && !hasUnsavedChanges);

  const saveButtonText = useMemo(() => {
    if (isFreePlan && !isLoggedIn) return t('visualizer.saveLoginToSave');
    return currentProjectId ? t('visualizer.save') : t('visualizer.saveAs');
  }, [isFreePlan, isLoggedIn, currentProjectId, t]);

  const exportButtonText = useMemo(() => t('visualizer.export'), [t]);

  const embedButtonText = useMemo(
    () => (isLoggedIn ? t('visualizer.embed.openButton') : t('visualizer.loginToExport')),
    [isLoggedIn, t],
  );

  return {
    selectedCountryId,
    currentProjectId,
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
    isRenameSubmitting,
    isSaveDisabled,
    saveButtonText,
    exportButtonText,
    embedButtonText,
    saveCurrentProject,
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
    handleDeleteCurrentProject,
    isDeleteModalOpen,
    isDeleteSubmitting,
    handleDeleteConfirm,
    handleDeleteCancel,
  };
}
