import { type FC, useCallback } from 'react';
import { CopyOutlined, ExportOutlined, LinkOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type Props = {
  embedPageUrl: string;
  iframeSnippet: string;
  submitting: boolean;
  copyText: (label: string, text: string) => Promise<void>;
  copyLabelUrl: string;
  copyLabelIframe: string;
};

export const ShareSection: FC<Props> = ({
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

  if (embedPageUrl) {
    return (
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
            onClick={handleCopyUrl}
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
          onClick={handleCopyIframe}
        >
          {copyLabelIframe}
        </Button>
      </Flex>
    );
  }

  return (
    <Typography.Paragraph type="secondary" className="mt-4 mb-0! text-xs">
      {t('visualizer.embed.shareLinkHint')}
    </Typography.Paragraph>
  );
};
