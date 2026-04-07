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
import { EMBED_PLAN_ERROR_EN, MODAL_STYLES, MODAL_WIDTH, SEO_TITLE_MAX } from './constants';
import { EmbedForm } from './EmbedForm';
import { Footer } from './Footer';
import { buildEmbedPageUrl, buildIframeSnippet, sanitizeKeywords } from './helpers';
import { ShareSection } from './ShareSection';
import { Title } from './Title';
import type { ProjectEmbedFormValues, ProjectEmbedModalProps } from './types';
import { useEmbedSEOFieldPlaceholders } from './useEmbedSEOFieldPlaceholders';
import { useEmbedSEOFieldsDefaultValues } from './useEmbedSEOFieldsDefaultValues';

const ProjectEmbedModal: FC<ProjectEmbedModalProps> = (props) => {
  const { open, onClose, project } = props;
  const { t } = useTypedTranslation();
  const { message } = useAppFeedback();
  const user = useProfileStore(selectUser);
  const updateProjectInList = useProjectsStore(selectUpdateProjectInList);

  const { defaultEmbedTitle, defaultSeoDescription, defaultKeywords } =
    useEmbedSEOFieldsDefaultValues(project);
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const storedTitle = project.embed.seo.title?.trim() ?? '';
    const storedDescription = project.embed.seo.description?.trim() ?? '';
    form.setFieldsValue({
      enabled: project.embed.enabled,
      seoTitle: storedTitle || defaultEmbedTitle,
      seoDescription: storedDescription || defaultSeoDescription,
      keywords: defaultKeywords,
    });
  }, [
    form,
    open,
    project.id,
    project.embed.enabled,
    project.embed.seo.title,
    project.embed.seo.description,
    defaultEmbedTitle,
    defaultSeoDescription,
    defaultKeywords,
  ]);

  const embedPageUrl = useMemo(
    () =>
      buildEmbedPageUrl({
        origin: window.location.origin,
        token: project.embed.token,
        enabled: project.embed.enabled,
      }),
    [project.embed.token, project.embed.enabled],
  );

  const iframeSnippet = useMemo(() => buildIframeSnippet(embedPageUrl), [embedPageUrl]);

  const copyLabelUrl = t('visualizer.embed.copyUrl');
  const copyLabelIframe = t('visualizer.embed.copyIframe');

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
        await updateProjectEmbed(project.id, {
          enabled: values.enabled,
          seo: {
            title: values.enabled ? values.seoTitle.trim().slice(0, SEO_TITLE_MAX) : null,
            description: values.enabled
              ? values.seoDescription.trim()
              : values.seoDescription.trim() || null,
            keywords: kw.length > 0 ? kw : null,
          },
        });
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
    void form.submit();
  }, [form]);

  if (!canUseEmbed) {
    return null;
  }

  return (
    <Modal
      title={<Title />}
      open={open}
      onCancel={onModalCancel}
      maskClosable={false}
      keyboard={!submitting}
      closable={{ disabled: submitting }}
      centered
      footer={<Footer submitting={submitting} onClose={onClose} onSubmit={onFooterSubmit} />}
      width={MODAL_WIDTH}
      destroyOnHidden
      styles={MODAL_STYLES}
    >
      <EmbedForm
        form={form}
        submitting={submitting}
        titlePlaceholder={titlePlaceholder}
        descriptionPlaceholder={descriptionPlaceholder}
        onFinish={onFinish}
      />
      <ShareSection
        embedPageUrl={embedPageUrl}
        iframeSnippet={iframeSnippet}
        submitting={submitting}
        copyText={copyText}
        copyLabelUrl={copyLabelUrl}
        copyLabelIframe={copyLabelIframe}
      />
    </Modal>
  );
};

export default ProjectEmbedModal;
