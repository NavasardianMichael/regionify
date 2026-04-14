import { type FC, useCallback, useMemo } from 'react';
import { Button, Flex, Form, Input, Select, Switch, Typography } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { Rule } from 'antd/es/form';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import {
  ALLOWED_ORIGIN_MAX_COUNT,
  KEYWORD_MAX_COUNT,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  TEXTAREA_STYLES,
} from './constants';
import { isValidAllowedOrigin, sanitizeAllowedOrigins, sanitizeKeywords } from './helpers';
import type { ProjectEmbedFormValues } from './types';

type Props = {
  form: FormInstance<ProjectEmbedFormValues>;
  submitting: boolean;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  onFinish: (values: ProjectEmbedFormValues) => void | Promise<void>;
};

type EmbedFormApi = {
  setFieldValue: <K extends keyof ProjectEmbedFormValues>(
    name: K,
    value: ProjectEmbedFormValues[K],
  ) => void;
  validateFields: (names?: Array<keyof ProjectEmbedFormValues>) => Promise<unknown>;
  getFieldValue: <K extends keyof ProjectEmbedFormValues>(name: K) => ProjectEmbedFormValues[K];
};

export const EmbedForm: FC<Props> = ({
  form,
  submitting,
  titlePlaceholder,
  descriptionPlaceholder,
  onFinish,
}) => {
  const { t } = useTypedTranslation();
  const formApi = form as unknown as EmbedFormApi;

  const embedEnabled = Form.useWatch('enabled', form) === true;
  const fieldsDisabled = submitting || !embedEnabled;

  const tagSelectNoData = useMemo(
    () => (
      <Typography.Text
        type="secondary"
        className="text-xs"
        data-i18n-key="visualizer.embed.tagSelectNoData"
      >
        {t('visualizer.embed.tagSelectNoData')}
      </Typography.Text>
    ),
    [t],
  );

  const seoTitleRules = useMemo<Rule[]>(
    () => [
      { max: SEO_TITLE_MAX, message: t('visualizer.embed.titleMax') },
      ({ getFieldValue }) => ({
        validator(_: unknown, value: unknown) {
          if (!getFieldValue('enabled')) return Promise.resolve();
          if (!(typeof value === 'string' && value.trim().length > 0)) {
            return Promise.reject(new Error(t('visualizer.embed.titleRequired')));
          }
          return Promise.resolve();
        },
      }),
    ],
    [t],
  );

  const seoDescriptionRules = useMemo<Rule[]>(
    () => [
      { max: SEO_DESCRIPTION_MAX, message: t('visualizer.embed.descriptionMax') },
      ({ getFieldValue }) => ({
        validator(_: unknown, value: unknown) {
          if (!getFieldValue('enabled')) return Promise.resolve();
          if (!(typeof value === 'string' && value.trim().length > 0)) {
            return Promise.reject(new Error(t('visualizer.embed.descriptionRequired')));
          }
          return Promise.resolve();
        },
      }),
    ],
    [t],
  );

  const handleEnabledChange = useCallback(() => {
    void formApi.validateFields(['seoTitle', 'seoDescription']).catch(() => {});
  }, [formApi]);

  const handleKeywordsChange = useCallback(
    (tags: string[]) => {
      formApi.setFieldValue('keywords', sanitizeKeywords(tags));
    },
    [formApi],
  );

  const allowedOriginsRules = useMemo<Rule[]>(
    () => [
      ({ getFieldValue }) => ({
        validator(_: unknown, value: unknown) {
          if (!getFieldValue('enabled')) return Promise.resolve();
          if (!Array.isArray(value)) return Promise.resolve();
          const allValid = value.every(
            (origin) => typeof origin === 'string' && isValidAllowedOrigin(origin),
          );
          return allValid
            ? Promise.resolve()
            : Promise.reject(new Error(t('visualizer.embed.allowedOriginsInvalid')));
        },
      }),
    ],
    [t],
  );

  const handleAllowedOriginsChange = useCallback(
    (tags: string[]) => {
      formApi.setFieldValue('allowedOrigins', sanitizeAllowedOrigins(tags));
      void formApi.validateFields(['allowedOrigins']).catch(() => {});
    },
    [formApi],
  );

  const handleAddCurrentOrigin = useCallback(() => {
    const currentOrigin = window.location.origin;
    const existing = formApi.getFieldValue('allowedOrigins') ?? [];
    const next = sanitizeAllowedOrigins([...existing, currentOrigin]);
    formApi.setFieldValue('allowedOrigins', next);
    void formApi.validateFields(['allowedOrigins']).catch(() => {});
  }, [formApi]);

  const allowedOriginsNoData = useMemo(
    () => (
      <Typography.Text
        type="secondary"
        className="text-xs"
        data-i18n-key="visualizer.embed.allowedOriginsNoData"
      >
        {t('visualizer.embed.allowedOriginsNoData')}
      </Typography.Text>
    ),
    [t],
  );

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} className="min-w-0">
      <Flex align="center" justify="space-between" gap="middle" wrap="wrap" className="mb-6">
        <Typography.Paragraph
          type="secondary"
          className="mb-0! flex-1 text-xs"
          data-i18n-key="visualizer.embed.intro"
        >
          {t('visualizer.embed.intro')}
        </Typography.Paragraph>
        <Flex align="center" gap="small" className="shrink-0">
          <Typography.Text
            className="text-xs whitespace-nowrap"
            data-i18n-key="visualizer.embed.publicToggle"
          >
            {t('visualizer.embed.publicToggle')}
          </Typography.Text>
          <Form.Item name="enabled" valuePropName="checked" className="mb-0!">
            <Switch disabled={submitting} onChange={handleEnabledChange} />
          </Form.Item>
        </Flex>
      </Flex>

      <Form.Item
        name="seoTitle"
        label={t('visualizer.embed.seoTitle')}
        dependencies={['enabled']}
        rules={seoTitleRules}
        data-i18n-key="visualizer.embed.seoTitle"
      >
        <Input
          maxLength={SEO_TITLE_MAX}
          showCount
          disabled={fieldsDisabled}
          placeholder={titlePlaceholder}
        />
      </Form.Item>

      <Form.Item
        name="seoDescription"
        label={t('visualizer.embed.seoDescription')}
        dependencies={['enabled']}
        rules={seoDescriptionRules}
        data-i18n-key="visualizer.embed.seoDescription"
      >
        <Input.TextArea
          rows={3}
          maxLength={SEO_DESCRIPTION_MAX}
          showCount
          disabled={fieldsDisabled}
          styles={TEXTAREA_STYLES}
          placeholder={descriptionPlaceholder}
        />
      </Form.Item>

      <Form.Item
        name="allowedOrigins"
        label={t('visualizer.embed.allowedOrigins')}
        dependencies={['enabled']}
        rules={allowedOriginsRules}
        extra={
          <Flex vertical gap={6}>
            <Typography.Text
              type="secondary"
              className="text-[11px]! leading-snug"
              data-i18n-key="visualizer.embed.allowedOriginsHint"
            >
              {t('visualizer.embed.allowedOriginsHint')}
            </Typography.Text>
            <Button
              type="link"
              size="small"
              className="h-auto! w-fit p-0! text-xs"
              disabled={fieldsDisabled}
              onClick={handleAddCurrentOrigin}
              data-i18n-key="visualizer.embed.allowedOriginsAddCurrent"
            >
              {t('visualizer.embed.allowedOriginsAddCurrent')}
            </Button>
          </Flex>
        }
        data-i18n-key="visualizer.embed.allowedOrigins"
      >
        <Select
          mode="tags"
          placeholder={t('visualizer.embed.allowedOriginsPlaceholder')}
          disabled={fieldsDisabled}
          maxCount={ALLOWED_ORIGIN_MAX_COUNT}
          tokenSeparators={[',']}
          className="w-full"
          notFoundContent={allowedOriginsNoData}
          onChange={handleAllowedOriginsChange}
          data-i18n-key="visualizer.embed.allowedOriginsPlaceholder"
        />
      </Form.Item>

      <Form.Item
        name="keywords"
        label={t('visualizer.embed.seoKeywords')}
        extra={
          <Typography.Text
            type="secondary"
            className="text-[11px]! leading-snug"
            data-i18n-key="visualizer.embed.keywordsHint"
          >
            {t('visualizer.embed.keywordsHint')}
          </Typography.Text>
        }
        className="mb-0!"
        data-i18n-key="visualizer.embed.seoKeywords"
      >
        <Select
          mode="tags"
          placeholder={t('visualizer.embed.keywordPlaceholder')}
          disabled={fieldsDisabled}
          maxCount={KEYWORD_MAX_COUNT}
          tokenSeparators={[',']}
          className="w-full"
          notFoundContent={tagSelectNoData}
          onChange={handleKeywordsChange}
          data-i18n-key="visualizer.embed.keywordPlaceholder"
        />
      </Form.Item>
    </Form>
  );
};
