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
  copyLabelIframe: string;
};

export const ShareSection: FC<Props> = ({
  embedEnabled,
  embedToken,
  embedPageUrl,
  iframeSnippet,
  submitting,
  copyText,
  copyLabelUrl,
  copyLabelIframe,
}) => {
  const { t } = useTypedTranslation();

  const handleCopyUrl = useCallback(() => {
    void copyText(copyLabelUrl, embedPageUrl);
  }, [copyLabelUrl, copyText, embedPageUrl]);

  const handleCopyIframe = useCallback(() => {
    void copyText(copyLabelIframe, iframeSnippet);
  }, [copyLabelIframe, copyText, iframeSnippet]);

  if (!embedEnabled) {
    return null;
  }

  const hasPublicUrl = Boolean(embedPageUrl && embedToken);
  const publicPagePath = embedToken ? getEmbedRoute(embedToken) : '';

  return (
    <Flex vertical gap="md" className="mt-4 min-w-0">
      <Flex vertical gap="small" className="min-w-0 rounded-md bg-gray-50 p-4">
        <Typography.Text className="text-xs font-semibold text-gray-600">
          {t('visualizer.embed.publicPage')}
        </Typography.Text>
        {hasPublicUrl ? (
          <>
            <AppNavLink
              to={publicPagePath}
              target="_blank"
              rel="noopener noreferrer"
              className="block max-w-full min-w-0 truncate text-xs"
            >
              {embedPageUrl}
            </AppNavLink>
            <Flex wrap gap="small">
              <Button
                type="default"
                size="small"
                icon={<LinkOutlined />}
                disabled={submitting}
                onClick={handleCopyUrl}
              >
                {copyLabelUrl}
              </Button>
            </Flex>
          </>
        ) : (
          <Typography.Text type="secondary" className="text-xs">
            {t('visualizer.embed.saveToGenerateLink')}
          </Typography.Text>
        )}
      </Flex>

      <Flex vertical gap="small" className="min-w-0 rounded-md bg-gray-50 p-4">
        <Typography.Text className="text-xs font-semibold text-gray-600">
          {t('visualizer.embed.embedIframeCode')}
        </Typography.Text>
        {iframeSnippet ? (
          <pre className="mb-0 max-h-40 overflow-x-auto overflow-y-auto rounded border border-neutral-200 bg-neutral-100 px-3 py-2 font-mono text-xs leading-relaxed whitespace-pre text-neutral-800">
            {iframeSnippet}
          </pre>
        ) : (
          <Typography.Text type="secondary" className="text-xs">
            {t('visualizer.embed.saveToGenerateLink')}
          </Typography.Text>
        )}
        <Button
          type="default"
          size="small"
          icon={<CopyOutlined />}
          disabled={submitting || !iframeSnippet}
          onClick={handleCopyIframe}
        >
          {copyLabelIframe}
        </Button>
      </Flex>
    </Flex>
  );
};
