import {
  type CSSProperties,
  type FC,
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  SaveOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import {
  Button,
  Divider,
  Flex,
  Input,
  Modal,
  Radio,
  type RadioChangeEvent,
  Spin,
  Splitter,
  theme,
  Tooltip,
  Typography,
} from 'antd';
import { getProject } from '@/api/projects';
import { selectHasTimelineData } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { selectLogout } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import {
  selectAddProject,
  selectCurrentProjectId,
  selectSetCurrentProjectId,
  selectSetSavedStateSnapshot,
} from '@/store/projects/selectors';
import { useProjectsStore } from '@/store/projects/store';
import { useIsMdUp } from '@/hooks/useIsMdUp';
import { useLoadProject } from '@/hooks/useLoadProject';
import { captureStateSnapshot } from '@/hooks/useProjectState';
import { useVisualizerPage } from '@/hooks/useVisualizerPage';
import { getProjectRoute, ROUTES } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { resetVisualizerToDefaultState } from '@/helpers/applyFullTemporaryProjectState';
import { saveReturnUrl } from '@/helpers/temporaryProjectState';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { CardLayout } from '@/components/visualizer/CardLayout';
import GeneralStylesPack from '@/components/visualizer/GeneralStylesPack';
import ImportDataPanel from '@/components/visualizer/ImportDataPanel';
import LegendConfigPanel from '@/components/visualizer/LegendConfigPanel';
import LegendStylesPanel from '@/components/visualizer/LegendStylesPanel';
import MapStylesPanel from '@/components/visualizer/MapStylesPanel';
import MapViewer from '@/components/visualizer/MapViewer';
import { RegionSelect } from '@/components/visualizer/RegionSelect';

const ExportMapModal = lazy(() => import('@/components/visualizer/ExportMapModal'));
const ProjectEmbedModal = lazy(() => import('@/components/visualizer/ProjectEmbedModal'));
const RenameProjectModal = lazy(() => import('@/components/projects/RenameProjectModal'));
const AnimationControls = lazy(() => import('@/components/visualizer/AnimationControls'));

type MobileVisualizerSection = 'map' | 'data' | 'styles';

const VisualizerPage: FC = () => {
  const { token } = theme.useToken();
  const { t } = useTypedTranslation();
  const { message } = useAppFeedback();
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const logout = useProfileStore(selectLogout);
  const currentProjectId = useProjectsStore(selectCurrentProjectId);
  const setCurrentProjectId = useProjectsStore(selectSetCurrentProjectId);
  const setSavedStateSnapshot = useProjectsStore(selectSetSavedStateSnapshot);
  const addProjectToStore = useProjectsStore(selectAddProject);
  const hasTimelineData = useVisualizerStore(selectHasTimelineData);
  const loadProject = useLoadProject();
  const isMdUp = useIsMdUp();
  const [mobileSection, setMobileSection] = useState<MobileVisualizerSection>('map');
  const [isResolvingProjectFromUrl, setIsResolvingProjectFromUrl] = useState(false);

  const {
    selectedCountryId,
    isExportModalOpen,
    isEmbedModalOpen,
    isLoggedIn,
    canUseEmbed,
    isSaving,
    isNameModalOpen,
    currentProject,
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
  } = useVisualizerPage();

  const embedButtonDisabled =
    !canUseEmbed || !selectedCountryId || !currentProject || isResolvingProjectFromUrl;

  const embedTooltipTitle = useMemo(() => {
    if (!embedButtonDisabled) return undefined;
    if (!canUseEmbed) {
      const onTooltip = token.colorTextLightSolid;
      const linkStyle: CSSProperties = {
        color: onTooltip,
        textDecoration: 'underline',
        textDecorationThickness: 'from-font',
        textUnderlineOffset: 4,
        fontWeight: 600,
      };
      return (
        <Flex vertical gap="small">
          <Typography.Text
            className="text-sm text-balance"
            style={{ color: onTooltip, textWrap: 'balance' }}
          >
            {t('visualizer.embed.tooltipChronographerBody', {
              planName: t('plans.items.chronographer.name'),
            })}
          </Typography.Text>
          <Link to={ROUTES.BILLING} className="text-sm" style={linkStyle}>
            {t('visualizer.embed.upgradePlansLink')}
          </Link>
        </Flex>
      );
    }
    if (!currentProject) return t('visualizer.embed.tooltipNeedSavedProject');
    if (!selectedCountryId) return t('visualizer.embed.tooltipSelectCountry');
    return undefined;
  }, [
    embedButtonDisabled,
    canUseEmbed,
    currentProject,
    selectedCountryId,
    t,
    token.colorTextLightSolid,
  ]);

  const embedButton = (
    <Button
      icon={<ShareAltOutlined />}
      type="primary"
      onClick={handleOpenEmbedModal}
      disabled={embedButtonDisabled}
    >
      {embedButtonText}
    </Button>
  );

  useEffect(() => {
    if (location.pathname === ROUTES.PROJECT_NEW) {
      return;
    }
    if (currentProjectId && urlProjectId !== undefined && urlProjectId !== currentProjectId) {
      navigate(getProjectRoute(currentProjectId), { replace: true });
    }
  }, [currentProjectId, urlProjectId, navigate, location.pathname]);

  useEffect(() => {
    if (location.pathname === ROUTES.PROJECT_NEW) return;
    if (!urlProjectId || urlProjectId === 'new') return;
    if (currentProjectId !== null) return;

    let cancelled = false;
    setIsResolvingProjectFromUrl(true);

    const run = async () => {
      try {
        const project = await getProject(urlProjectId);
        if (cancelled) return;
        loadProject(project);
        if (!useProjectsStore.getState().projects.some((p) => p.id === project.id)) {
          addProjectToStore(project);
        }
      } catch (error) {
        if (cancelled) return;
        const err = error as Error & { code?: string };
        if (err.code === 'UNAUTHORIZED') {
          saveReturnUrl(`${location.pathname}${location.search}`);
          logout();
          message.error('Session expired. Please log in again.', 0);
          navigate(ROUTES.LOGIN);
        } else {
          message.error(t('messages.projectLoadFailed'), 0);
          navigate(ROUTES.PROJECTS);
        }
      } finally {
        if (!cancelled) {
          setIsResolvingProjectFromUrl(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    urlProjectId,
    currentProjectId,
    location.pathname,
    location.search,
    loadProject,
    addProjectToStore,
    logout,
    message,
    navigate,
    t,
  ]);

  // Run before child useEffects (e.g. ImportDataPanel async region loader) so the store is cleared first.
  useLayoutEffect(() => {
    if (location.pathname !== ROUTES.PROJECT_NEW) return;
    resetVisualizerToDefaultState();
    setCurrentProjectId(null);
    requestAnimationFrame(() => {
      setSavedStateSnapshot(captureStateSnapshot());
    });
  }, [location.pathname, setCurrentProjectId, setSavedStateSnapshot]);

  const dataPanel = (
    <CardLayout component="aside" vertical className="h-full">
      <RegionSelect />
      <Divider />
      <ImportDataPanel />
      <Divider />
      <LegendConfigPanel />
    </CardLayout>
  );

  const mapPanel = (
    <CardLayout className="min-h-md gap-md h-full">
      <Flex align="center" justify="space-between" wrap className="mb-sm shrink-0" gap="middle">
        <Flex align="center" gap="small" className="min-w-0">
          <Typography.Title
            level={3}
            className="text-primary mb-0! min-w-0 flex-1 truncate text-base font-semibold"
          >
            {currentProject?.name?.trim() ? currentProject.name : t('visualizer.mapAreaTitle')}
          </Typography.Title>
          {isLoggedIn && currentProject && !isResolvingProjectFromUrl ? (
            <Flex gap={0} className="shrink-0">
              <Tooltip title={t('visualizer.mapHeaderRenameTooltip')}>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={handleOpenRenameModal}
                  aria-label={t('visualizer.mapHeaderRenameTooltip')}
                />
              </Tooltip>
              <Tooltip title={t('visualizer.mapHeaderDeleteTooltip')}>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDeleteCurrentProject}
                  aria-label={t('visualizer.mapHeaderDeleteTooltip')}
                />
              </Tooltip>
            </Flex>
          ) : null}
        </Flex>
        <Flex gap="small" wrap="wrap">
          <Button
            icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={isSaveDisabled || isResolvingProjectFromUrl}
            loading={isSaving}
          >
            {saveButtonText}
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleOpenExportModal}
            disabled={!selectedCountryId || isResolvingProjectFromUrl}
          >
            {exportButtonText}
          </Button>
          {isLoggedIn ? (
            embedButtonDisabled ? (
              <Tooltip title={embedTooltipTitle}>
                <span className="inline-flex">{embedButton}</span>
              </Tooltip>
            ) : (
              embedButton
            )
          ) : null}
        </Flex>
      </Flex>
      {!isResolvingProjectFromUrl && hasTimelineData && (
        <Suspense>
          <AnimationControls />
        </Suspense>
      )}
      {isResolvingProjectFromUrl ? (
        <Flex align="center" justify="center" className="min-h-0 flex-1">
          <Spin size="large" />
        </Flex>
      ) : (
        <Suspense fallback={<Spin className="m-auto flex-1" />}>
          <MapViewer className="min-h-0 flex-1" />
        </Suspense>
      )}
    </CardLayout>
  );

  const stylesPanel = (
    <CardLayout component="aside" vertical className="h-full">
      <MapStylesPanel />
      <Divider />
      <LegendStylesPanel />
      <Divider />
      <GeneralStylesPack />
    </CardLayout>
  );

  return (
    <>
      {isMdUp ? (
        <Splitter orientation="horizontal" className="h-full min-h-0 w-full">
          <Splitter.Panel
            defaultSize="25%"
            min="15%"
            max="40%"
            collapsible={{ start: true, end: true, showCollapsibleIcon: true }}
          >
            {dataPanel}
          </Splitter.Panel>
          <Splitter.Panel>{mapPanel}</Splitter.Panel>
          <Splitter.Panel
            defaultSize="25%"
            min="15%"
            max="35%"
            collapsible={{ start: true, end: false, showCollapsibleIcon: true }}
          >
            {stylesPanel}
          </Splitter.Panel>
        </Splitter>
      ) : (
        <Flex vertical gap={8} className="h-full min-h-0 w-full min-w-0 flex-1">
          <Radio.Group
            value={mobileSection}
            optionType="button"
            buttonStyle="solid"
            block
            className="shrink-0 [&_.ant-radio-button-wrapper]:flex-1 [&_.ant-radio-button-wrapper]:basis-0 [&_.ant-radio-button-wrapper]:px-2! [&_.ant-radio-button-wrapper]:text-center! [&_.ant-radio-button-wrapper]:first:rounded-s-md [&_.ant-radio-button-wrapper]:last:rounded-e-md"
            onChange={(e: RadioChangeEvent) => {
              setMobileSection(e.target.value as MobileVisualizerSection);
            }}
          >
            <Radio.Button value="map">{t('visualizer.tabMap')}</Radio.Button>
            <Radio.Button value="data">{t('visualizer.tabData')}</Radio.Button>
            <Radio.Button value="styles">{t('visualizer.tabStyles')}</Radio.Button>
          </Radio.Group>
          <div className="relative min-h-0 w-full min-w-0 flex-1 overflow-hidden">
            <div
              className={`flex h-full min-h-0 w-full flex-col ${mobileSection === 'map' ? '' : 'hidden'}`}
              aria-hidden={mobileSection !== 'map'}
            >
              {mapPanel}
            </div>
            <div
              className={`flex h-full min-h-0 w-full flex-col ${mobileSection === 'data' ? '' : 'hidden'}`}
              aria-hidden={mobileSection !== 'data'}
            >
              {dataPanel}
            </div>
            <div
              className={`flex h-full min-h-0 w-full flex-col ${mobileSection === 'styles' ? '' : 'hidden'}`}
              aria-hidden={mobileSection !== 'styles'}
            >
              {stylesPanel}
            </div>
          </div>
        </Flex>
      )}

      {isExportModalOpen && (
        <Suspense>
          <ExportMapModal open={isExportModalOpen} onClose={handleCloseExportModal} />
        </Suspense>
      )}

      {isEmbedModalOpen && currentProject && canUseEmbed && (
        <Suspense>
          <ProjectEmbedModal
            open={isEmbedModalOpen}
            onClose={handleCloseEmbedModal}
            project={currentProject}
          />
        </Suspense>
      )}

      {isRenameModalOpen && currentProject ? (
        <Suspense>
          <RenameProjectModal
            project={currentProject}
            name={renameName}
            onNameChange={setRenameNameValue}
            onConfirm={handleRenameModalConfirm}
            onCancel={handleRenameModalCancel}
            confirmLoading={isRenameSubmitting}
          />
        </Suspense>
      ) : null}

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
