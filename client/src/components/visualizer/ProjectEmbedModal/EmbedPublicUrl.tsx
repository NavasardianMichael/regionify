import { type FC } from 'react';
import { LinkOutlined } from '@ant-design/icons';
import { Button, Flex, Spin, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { AppNavLink } from '@/components/ui/AppNavLink';

type Props = {
  hasPublicUrl: boolean;
  pendingToken: boolean;
  publicPagePath: string;
  embedPageUrl: string;
  submitting: boolean;
  copyLabelUrl: string;
  onCopyUrl: () => void;
};

export const EmbedPublicUrl: FC<Props> = ({
  hasPublicUrl,
  pendingToken,
  publicPagePath,
  embedPageUrl,
  submitting,
  copyLabelUrl,
  onCopyUrl,
}) => {
  const { t } = useTypedTranslation();

  if (pendingToken) {
    return <Spin size="small" />;
  }

  if (!hasPublicUrl) {
    return (
      <Typography.Text type="secondary" className="text-sm">
        {t('visualizer.embed.saveToGenerateLink')}
      </Typography.Text>
    );
  }

  return (
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
          onClick={onCopyUrl}
        >
          {copyLabelUrl}
        </Button>
      </Flex>
    </>
  );
};
