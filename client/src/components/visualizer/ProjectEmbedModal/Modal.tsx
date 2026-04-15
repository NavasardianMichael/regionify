import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { PLAN_DETAILS } from '@regionify/shared';
import { Form, Modal } from 'antd';
import { getProject, updateProjectEmbed } from '@/api/projects';
import { selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { selectUpdateProjectInList } from '@/store/projects/selectors';
import { useProjectsStore } from '@/store/projects/store';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import bodyScrollbarStyles from '@/components/visualizer/modalBodyScrollbar.module.css';
import { EMBED_PLAN_ERROR_EN, SEO_TITLE_MAX } from './constants';
import { EmbedForm } from './EmbedForm';
import { Footer } from './Footer';
import {
  buildEmbedPageUrl,
  buildIframeSnippet,
  sanitizeAllowedOrigins,
  sanitizeKeywords,
} from './helpers';
import { ShareSection } from './ShareSection';
import { Title } from './Title';
import type { ProjectEmbedFormValues, ProjectEmbedModalProps } from './types';
import { useEmbedSEOFieldPlaceholders } from './useEmbedSEOFieldPlaceholders';
import { useEmbedSEOFieldsDefaultValues } from './useEmbedSEOFieldsDefaultValues';

type EmbedModalFormApi = {
  setFieldsValue: (values: Partial<ProjectEmbedFormValues>) => void;
  submit: () => void;
};

const ProjectEmbedModal: FC<ProjectEmbedModalProps> = (props) => {
  const { open, onClose, project } = props;
  const { t } = useTypedTranslation();
  const { message } = useAppFeedback();
  const user = useProfileStore(selectUser);
  const updateProjectInList = useProjectsStore(selectUpdateProjectInList);

  const {
    defaultEmbedTitle,
    defaultSeoDescription,
    defaultKeywords,
    defaultAllowedOrigins,
    defaultAllowedOriginsAllowAll,
  } = useEmbedSEOFieldsDefaultValues(project);
  const { titlePlaceholder, descriptionPlaceholder } = useEmbedSEOFieldPlaceholders({
    defaultEmbedTitle,
    projectName: project.name,
  });

  const canUseEmbed = useMemo(() => {
    const plan = user?.plan;
    if (!plan) return false;
    return PLAN_DETAILS[plan]?.limits.publicEmbed === true;
  }, [user?.plan]);

  const [form] = Form.useForm<ProjectEmbedFormValues>();
  const formApi = form as unknown as EmbedModalFormApi;
  const [submitting, setSubmitting] = useState(false);
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const embedEnabled = Form.useWatch('enabled', form) === true;
  const showHeader = Form.useWatch('showHeader', form) !== false;

  const currentToken = savedToken ?? project.embed.token;

  useEffect(() => {
    if (!open) return;
    const storedTitle = project.embed.seo.title?.trim() ?? '';
    const storedDescription = project.embed.seo.description?.trim() ?? '';
    formApi.setFieldsValue({
      enabled: project.embed.enabled,
      seoTitle: storedTitle || defaultEmbedTitle,
      seoDescription: storedDescription || defaultSeoDescription,
      keywords: defaultKeywords,
      allowedOriginsAllowAll: defaultAllowedOriginsAllowAll,
      allowedOrigins: defaultAllowedOrigins,
      showHeader: project.embed.showHeader,
    });
    setSavedToken(null);
  }, [
    formApi,
    open,
    project.id,
    project.embed.enabled,
    project.embed.showHeader,
    project.embed.seo.title,
    project.embed.seo.description,
    defaultEmbedTitle,
    defaultSeoDescription,
    defaultAllowedOrigins,
    defaultAllowedOriginsAllowAll,
    defaultKeywords,
  ]);

  const embedPageUrl = useMemo(
    () =>
      buildEmbedPageUrl({
        origin: window.location.origin,
        token: currentToken,
        enabled: embedEnabled,
        showHeader,
      }),
    [currentToken, embedEnabled, showHeader],
  );

  const iframeSnippet = useMemo(() => buildIframeSnippet(embedPageUrl), [embedPageUrl]);

  const copyLabelEmbed = t('visualizer.embed.copyEmbed');

  const copyText = useCallback(
    async (label: string, text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        message.success(t('visualizer.embed.copied', { label }));
      } catch {
        message.error(t('visualizer.embed.copyFailed'));
      }
    },
    [message, t],
  );

  const onFinish = useCallback(
    async (values: ProjectEmbedFormValues) => {
      setSubmitting(true);
      try {
        const kw = sanitizeKeywords(values.keywords);
        const allowedOrigins = values.allowedOriginsAllowAll
          ? ['*']
          : sanitizeAllowedOrigins(values.allowedOrigins);
        const embedResult = await updateProjectEmbed(project.id, {
          enabled: values.enabled,
          showHeader: values.showHeader,
          seo: {
            title: values.enabled ? values.seoTitle.trim().slice(0, SEO_TITLE_MAX) : null,
            description: values.enabled
              ? values.seoDescription.trim()
              : values.seoDescription.trim() || null,
            keywords: kw.length > 0 ? kw : null,
            allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : null,
          },
        });
        setSavedToken(embedResult.embed.token);
        const fresh = await getProject(project.id);
        updateProjectInList(fresh);
        message.success(t('visualizer.embed.saveSuccess'));
      } catch (e) {
        const raw = e instanceof Error ? e.message : '';
        if (raw === EMBED_PLAN_ERROR_EN) {
          message.error(
            t('visualizer.embed.planRequired', { planName: t('plans.items.chronographer.name') }),
          );
        } else {
          message.error(raw || t('visualizer.embed.saveFailed'));
        }
      } finally {
        setSubmitting(false);
      }
    },
    [message, project.id, t, updateProjectInList],
  );

  const onModalCancel = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [onClose, submitting]);

  const onFooterSubmit = useCallback(() => {
    void formApi.submit();
  }, [formApi]);

  if (!canUseEmbed) {
    return null;
  }

  return (
    <Modal
      title={<Title />}
      open={open}
      onCancel={onModalCancel}
      className={`${bodyScrollbarStyles.bodyScrollbar} w-4/5! max-w-[1200px]! lg:w-2/3!`}
      classNames={{
        container: 'max-h-[90vh]',
        body: 'min-h-0 max-h-[calc(90vh-180px)] overflow-y-auto',
      }}
      maskClosable={false}
      keyboard={!submitting}
      closable={{ disabled: submitting }}
      centered
      footer={<Footer submitting={submitting} onClose={onClose} onSubmit={onFooterSubmit} />}
      destroyOnHidden
    >
      <EmbedForm
        form={form}
        submitting={submitting}
        titlePlaceholder={titlePlaceholder}
        descriptionPlaceholder={descriptionPlaceholder}
        onFinish={onFinish}
      />
      <ShareSection
        embedEnabled={embedEnabled}
        embedToken={currentToken}
        embedPageUrl={embedPageUrl}
        iframeSnippet={iframeSnippet}
        submitting={submitting}
        copyText={copyText}
        copyLabelEmbed={copyLabelEmbed}
      />
    </Modal>
  );
};

export default ProjectEmbedModal;
