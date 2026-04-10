import { type FC } from 'react';
import { CopyOutlined } from '@ant-design/icons';
import { Button, Flex, Spin, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type Props = {
  iframeSnippet: string;
  pendingToken: boolean;
  submitting: boolean;
  copyLabelEmbed: string;
  onCopyEmbed: () => void;
};

export const EmbedIframeCode: FC<Props> = ({
  iframeSnippet,
  pendingToken,
  submitting,
  copyLabelEmbed,
  onCopyEmbed,
}) => {
  const { t } = useTypedTranslation();

  const renderContent = (): React.ReactNode => {
    if (pendingToken) {
      return <Spin size="small" />;
    }

    if (!iframeSnippet) {
      return (
        <Typography.Text type="secondary" className="text-sm">
          {t('visualizer.embed.saveToGenerateLink')}
        </Typography.Text>
      );
    }

    return (
      <pre className="mb-0 max-h-48 min-h-0 overflow-auto rounded border border-neutral-200 bg-white px-3 py-2 font-mono text-sm leading-relaxed whitespace-pre text-neutral-800">
        {iframeSnippet}
      </pre>
    );
  };

  return (
    <>
      {renderContent()}
      <Flex>
        <Button
          type="dashed"
          size="small"
          icon={<CopyOutlined />}
          disabled={submitting || !iframeSnippet}
          className="w-fit"
          onClick={onCopyEmbed}
        >
          {copyLabelEmbed}
        </Button>
      </Flex>
    </>
  );
};
