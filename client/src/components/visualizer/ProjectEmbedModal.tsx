import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { CopyOutlined, ExportOutlined, LinkOutlined, ShareAltOutlined } from '@ant-design/icons';
import { PLAN_DETAILS } from '@regionify/shared';
import { Button, Flex, Form, Input, Modal, Select, Switch, Typography } from 'antd';
import { getProject, updateProjectEmbed } from '@/api/projects';
import type { Project } from '@/api/projects/types';
import { selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { selectUpdateProjectInList } from '@/store/projects/selectors';
import { useProjectsStore } from '@/store/projects/store';
import { getEmbedRoute } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { useAppFeedback } from '@/components/shared/useAppFeedback';

const EMBED_PLAN_ERROR_EN = 'Public embed requires Chronographer plan';

type FormValues = {
  enabled: boolean;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
};

function normalizeKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x): x is string => typeof x === 'string')
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function sanitizeKeywords(tags: string[]): string[] {
  return tags
    .map((t) => t.trim().slice(0, 80))
    .filter((t) => t.length > 0)
    .slice(0, 5);
}

type Props = {
  open: boolean;
  onClose: () => void;
  project: Project;
};

const ProjectEmbedModal: FC<Props> = ({ open, onClose, project }) => {
  const { t } = useTypedTranslation();
  const { message } = useAppFeedback();
  const user = useProfileStore(selectUser);
  const updateProjectInList = useProjectsStore(selectUpdateProjectInList);
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);

  const canUseEmbed = useMemo(() => {
    const plan = user?.plan;
    if (!plan) return false;
    return PLAN_DETAILS[plan]?.limits.publicEmbed === true;
  }, [user?.plan]);

  const autoEmbedTitle = useMemo(
    () => `${project.name} — Regionify`.trim().slice(0, 200),
    [project.name],
  );

  const defaultSeoDescription = useMemo(
    () =>
      t('visualizer.embed.defaultMetaDescription', { projectName: project.name })
        .trim()
        .slice(0, 150),
    [t, project.name],
  );

  const titleFieldPlaceholder = useMemo(
    () => t('visualizer.embed.titlePlaceholder', { example: autoEmbedTitle }),
    [t, autoEmbedTitle],
  );

  const descriptionFieldPlaceholder = useMemo(
    () => t('visualizer.embed.descriptionPlaceholder', { projectName: project.name }),
    [t, project.name],
  );

  const initialKeywords = useMemo(
    () => normalizeKeywords(project.embedSeoKeywords),
    [project.embedSeoKeywords],
  );

  useEffect(() => {
    if (!open) return;
    const storedTitle = project.embedSeoTitle?.trim() ?? '';
    const storedDescription = project.embedSeoDescription?.trim() ?? '';
    form.setFieldsValue({
      enabled: project.embedEnabled,
      seoTitle: storedTitle || autoEmbedTitle,
      seoDescription: storedDescription || defaultSeoDescription,
      keywords: initialKeywords,
    });
  }, [
    form,
    open,
    project.id,
    project.embedEnabled,
    project.embedSeoTitle,
    project.embedSeoDescription,
    autoEmbedTitle,
    defaultSeoDescription,
    initialKeywords,
  ]);

  const embedPageUrl = useMemo(() => {
    if (!project.embedToken || !project.embedEnabled) return '';
    return `${window.location.origin}${getEmbedRoute(project.embedToken)}`;
  }, [project.embedToken, project.embedEnabled]);

  const iframeSnippet = useMemo(() => {
    if (!embedPageUrl) return '';
    return `<iframe src="${embedPageUrl}" width="100%" height="560" style="border:0" title="Regionify map"></iframe>`;
  }, [embedPageUrl]);

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
    async (values: FormValues) => {
      setSubmitting(true);
      try {
        const kw = sanitizeKeywords(values.keywords);
        await updateProjectEmbed(project.id, {
          enabled: values.enabled,
          seoTitle: values.enabled ? values.seoTitle.trim().slice(0, 200) : null,
          seoDescription: values.enabled
            ? values.seoDescription.trim()
            : values.seoDescription.trim() || null,
          seoKeywords: kw.length > 0 ? kw : null,
        });
        const fresh = await getProject(project.id);
        updateProjectInList(fresh);
        message.success(t('visualizer.embed.saveSuccess'));
      } catch (e) {
        const raw = e instanceof Error ? e.message : '';
        if (raw === EMBED_PLAN_ERROR_EN) {
          message.error(t('visualizer.embed.planRequired'));
        } else {
          message.error(raw || t('visualizer.embed.saveFailed'));
        }
      } finally {
        setSubmitting(false);
      }
    },
    [message, project.id, t, updateProjectInList],
  );

  if (!canUseEmbed) {
    return null;
  }

  const tagSelectNoData = (
    <Typography.Text type="secondary" className="text-xs">
      {t('visualizer.embed.tagSelectNoData')}
    </Typography.Text>
  );

  return (
    <Modal
      title={
        <Flex align="center" gap="small" className="mb-6!">
          <ShareAltOutlined className="text-primary" />
          <Typography.Title level={4} className="mb-0!">
            {t('visualizer.embed.modalTitle')}
          </Typography.Title>
        </Flex>
      }
      open={open}
      onCancel={() => {
        if (submitting) return;
        onClose();
      }}
      maskClosable={false}
      keyboard={!submitting}
      closable={{ disabled: submitting }}
      footer={
        <Flex justify="flex-end" gap="small">
          <Button onClick={onClose} disabled={submitting}>
            {t('nav.cancel')}
          </Button>
          <Button type="primary" loading={submitting} onClick={() => form.submit()}>
            {t('visualizer.save')}
          </Button>
        </Flex>
      }
      width={560}
      destroyOnHidden
      styles={{ body: { maxHeight: 'min(70vh, 640px)', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} className="min-w-0">
        <Flex align="flex-start" justify="space-between" gap="middle" wrap="wrap" className="mb-6">
          <Typography.Paragraph
            type="secondary"
            className="mb-0! max-w-[min(100%,20rem)] flex-1 text-xs"
          >
            {t('visualizer.embed.intro')}
          </Typography.Paragraph>
          <Flex align="center" gap="small" className="shrink-0">
            <Typography.Text className="text-xs whitespace-nowrap">
              {t('visualizer.embed.publicToggle')}
            </Typography.Text>
            <Form.Item name="enabled" valuePropName="checked" className="mb-0!">
              <Switch
                disabled={submitting}
                onChange={() => {
                  void form.validateFields(['seoTitle', 'seoDescription']).catch(() => {});
                }}
              />
            </Form.Item>
          </Flex>
        </Flex>

        <Form.Item
          name="seoTitle"
          label={t('visualizer.embed.seoTitle')}
          extra={
            <Typography.Text type="secondary" className="text-xs">
              {t('visualizer.embed.titleInitialHint')}
            </Typography.Text>
          }
          dependencies={['enabled']}
          rules={[
            { max: 200, message: t('visualizer.embed.titleMax') },
            ({ getFieldValue }) => ({
              validator(_: unknown, value: unknown) {
                if (!getFieldValue('enabled')) return Promise.resolve();
                if (!(typeof value === 'string' && value.trim().length > 0)) {
                  return Promise.reject(new Error(t('visualizer.embed.titleRequired')));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <Input
            maxLength={200}
            showCount
            disabled={submitting}
            placeholder={titleFieldPlaceholder}
          />
        </Form.Item>

        <Form.Item
          name="seoDescription"
          label={t('visualizer.embed.seoDescription')}
          dependencies={['enabled']}
          rules={[
            { max: 150, message: t('visualizer.embed.descriptionMax') },
            ({ getFieldValue }) => ({
              validator(_: unknown, value: unknown) {
                if (!getFieldValue('enabled')) return Promise.resolve();
                if (!(typeof value === 'string' && value.trim().length > 0)) {
                  return Promise.reject(new Error(t('visualizer.embed.descriptionRequired')));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <Input.TextArea
            rows={3}
            maxLength={150}
            showCount
            disabled={submitting}
            styles={{ textarea: { resize: 'none' } }}
            placeholder={descriptionFieldPlaceholder}
          />
        </Form.Item>

        <Form.Item
          name="keywords"
          label={t('visualizer.embed.seoKeywords')}
          extra={
            <Typography.Text type="secondary" className="text-xs">
              {t('visualizer.embed.keywordsHint')}
            </Typography.Text>
          }
          className="mb-0!"
        >
          <Select
            mode="tags"
            placeholder={t('visualizer.embed.keywordPlaceholder')}
            disabled={submitting}
            maxCount={5}
            tokenSeparators={[',']}
            className="w-full"
            notFoundContent={tagSelectNoData}
            onChange={(tags: string[]) => {
              form.setFieldValue('keywords', sanitizeKeywords(tags));
            }}
          />
        </Form.Item>
      </Form>

      {embedPageUrl ? (
        <Flex vertical gap="small" className="mt-4 rounded-md bg-gray-50 p-3">
          <Typography.Text className="text-xs font-semibold text-gray-600">
            {t('visualizer.embed.shareUrl')}
          </Typography.Text>
          <Typography.Text className="text-xs break-all">{embedPageUrl}</Typography.Text>
          <Flex wrap gap="small">
            <Button
              type="default"
              size="small"
              icon={<ExportOutlined />}
              disabled={submitting}
              href={embedPageUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('visualizer.embed.openInNewTab')}
            </Button>
            <Button
              type="default"
              size="small"
              icon={<LinkOutlined />}
              disabled={submitting}
              onClick={() => void copyText(copyLabelUrl, embedPageUrl)}
            >
              {copyLabelUrl}
            </Button>
          </Flex>

          <Typography.Text className="mt-2 text-xs font-semibold text-gray-600">
            {t('visualizer.embed.iframe')}
          </Typography.Text>
          <Typography.Paragraph className="mb-0! font-mono text-xs break-all">
            {iframeSnippet}
          </Typography.Paragraph>
          <Button
            type="default"
            size="small"
            icon={<CopyOutlined />}
            disabled={submitting}
            onClick={() => void copyText(copyLabelIframe, iframeSnippet)}
          >
            {copyLabelIframe}
          </Button>
        </Flex>
      ) : (
        <Typography.Paragraph type="secondary" className="mt-4 mb-0! text-xs">
          {t('visualizer.embed.shareLinkHint')}
        </Typography.Paragraph>
      )}
    </Modal>
  );
};

export default ProjectEmbedModal;
