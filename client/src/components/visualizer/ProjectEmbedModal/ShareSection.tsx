import { type FC, useCallback } from 'react';
import { CopyOutlined, LinkOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { getEmbedRoute } from '@/constants/routes';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { AppNavLink } from '@/components/ui/AppNavLink';

type Props = {
  embedEnabled: boolean;
  embedToken: string | null | undefined;
  embedPageUrl: string;
  iframeSnippet: string;
  submitting: boolean;
  copyText: (label: string, text: string) => Promise<void>;
  copyLabelUrl: string;
  copyLabelEmbed: string;
};

export const ShareSection: FC<Props> = ({
  embedEnabled,
  embedToken,
  embedPageUrl,
  iframeSnippet,
  submitting,
  copyText,
  copyLabelUrl,
  copyLabelEmbed,
}) => {
  const { t } = useTypedTranslation();

  const handleCopyUrl = useCallback(() => {
    void copyText(copyLabelUrl, embedPageUrl);
  }, [copyLabelUrl, copyText, embedPageUrl]);

  const handleCopyEmbed = useCallback(() => {
    void copyText(copyLabelEmbed, iframeSnippet);
  }, [copyLabelEmbed, copyText, iframeSnippet]);

  if (!embedEnabled) {
    return null;
  }

  const hasPublicUrl = Boolean(embedPageUrl && embedToken);
  const publicPagePath = embedToken ? getEmbedRoute(embedToken) : '';

  return (
    <Flex vertical gap="middle" className="mt-6! min-w-0">
      <Flex vertical gap="middle">
        <Typography.Text className="text-sm font-medium text-neutral-900">
          {t('visualizer.embed.publicPage')}
        </Typography.Text>
        {hasPublicUrl ? (
          <>
            <div className="w-full min-w-0">
              <AppNavLink
                to={publicPagePath}
                target="_blank"
                rel="noopener noreferrer"
                className="block max-w-full min-w-0 truncate text-sm"
                title={embedPageUrl}
              >
                {embedPageUrl}
              </AppNavLink>
            </div>
            <Flex>
              <Button
                type="dashed"
                size="small"
                icon={<LinkOutlined />}
                disabled={submitting}
                className="w-fit"
                onClick={handleCopyUrl}
              >
                {copyLabelUrl}
              </Button>
            </Flex>
          </>
        ) : (
          <Typography.Text type="secondary" className="text-sm">
            {t('visualizer.embed.saveToGenerateLink')}
          </Typography.Text>
        )}
      </Flex>
      <Flex vertical gap="middle" className="min-w-0">
        <Typography.Text className="text-sm font-medium text-neutral-900">
          {t('visualizer.embed.embedIframeCode')}
        </Typography.Text>
        {iframeSnippet ? (
          <pre className="mb-0 max-h-48 min-h-0 overflow-auto rounded border border-neutral-200 bg-white px-3 py-2 font-mono text-sm leading-relaxed whitespace-pre text-neutral-800">
            {iframeSnippet}
          </pre>
        ) : (
          <Typography.Text type="secondary" className="text-sm">
            {t('visualizer.embed.saveToGenerateLink')}
          </Typography.Text>
        )}
        <Flex>
          <Button
            type="dashed"
            size="small"
            icon={<CopyOutlined />}
            disabled={submitting || !iframeSnippet}
            className="w-fit"
            onClick={handleCopyEmbed}
          >
            {copyLabelEmbed}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};
