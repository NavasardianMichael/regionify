import { type FC, useCallback } from 'react';
import { Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { EmbedIframeCode } from './EmbedIframeCode';
import { EmbedPublicUrl } from './EmbedPublicUrl';

type Props = {
  embedEnabled: boolean;
  embedToken: string | null | undefined;
  embedPageUrl: string;
  iframeSnippet: string;
  submitting: boolean;
  copyText: (label: string, text: string) => Promise<void>;
  copyLabelEmbed: string;
};

export const ShareSection: FC<Props> = ({
  embedEnabled,
  embedToken,
  embedPageUrl,
  iframeSnippet,
  submitting,
  copyText,
  copyLabelEmbed,
}) => {
  const { t } = useTypedTranslation();

  const handleCopyUrl = useCallback(() => {
    void copyText(t('visualizer.embed.copyUrl'), embedPageUrl);
  }, [copyText, embedPageUrl, t]);

  const handleCopyEmbed = useCallback(() => {
    void copyText(copyLabelEmbed, iframeSnippet);
  }, [copyLabelEmbed, copyText, iframeSnippet]);

  if (!embedEnabled) {
    return null;
  }

  const hasPublicUrl = Boolean(embedPageUrl && embedToken);
  const pendingToken = !hasPublicUrl && submitting;

  return (
    <Flex vertical gap="middle" className="mt-6! min-w-0">
      <Flex vertical gap="small">
        <Typography.Text
          className="text-sm font-semibold text-neutral-900"
          data-i18n-key="visualizer.embed.publicPage"
        >
          {t('visualizer.embed.publicPage')}
        </Typography.Text>
        <EmbedPublicUrl
          hasPublicUrl={hasPublicUrl}
          pendingToken={pendingToken}
          embedPageUrl={embedPageUrl}
          submitting={submitting}
          onCopyUrl={handleCopyUrl}
        />
      </Flex>
      <Flex vertical gap="small" className="min-w-0">
        <Typography.Text
          className="text-sm font-semibold text-neutral-900"
          data-i18n-key="visualizer.embed.embedIframeCode"
        >
          {t('visualizer.embed.embedIframeCode')}
        </Typography.Text>
        <EmbedIframeCode
          iframeSnippet={iframeSnippet}
          pendingToken={pendingToken}
          submitting={submitting}
          copyLabelEmbed={copyLabelEmbed}
          onCopyEmbed={handleCopyEmbed}
        />
      </Flex>
    </Flex>
  );
};
