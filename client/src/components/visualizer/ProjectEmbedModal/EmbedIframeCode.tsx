import { type FC } from 'react';
import { CopyOutlined } from '@ant-design/icons';
import { Button, Spin, Typography } from 'antd';
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
  onCopyEmbed,
}) => {
  const { t } = useTypedTranslation();

  if (pendingToken) {
    return <Spin size="small" />;
  }

  if (!iframeSnippet) {
    return (
      <Typography.Text
        type="secondary"
        className="text-sm"
        data-i18n-key="visualizer.embed.saveToGenerateLink"
      >
        {t('visualizer.embed.saveToGenerateLink')}
      </Typography.Text>
    );
  }

  return (
    <div className="relative rounded border border-neutral-200 bg-white">
      <pre className="mb-0 max-h-48 min-h-0 overflow-auto px-3 py-2 pr-9 font-mono text-sm leading-relaxed whitespace-pre text-neutral-800">
        {iframeSnippet}
      </pre>
      <div className="absolute top-1.5 right-2">
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          disabled={submitting}
          onClick={onCopyEmbed}
          data-i18n-key="visualizer.embed.copyEmbed"
        />
      </div>
    </div>
  );
};
