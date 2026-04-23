import { type FC } from 'react';
import { CopyOutlined } from '@ant-design/icons';
import { Button, Flex, Spin, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { AppNavLink } from '@/components/ui/AppNavLink';

type Props = {
  hasPublicUrl: boolean;
  pendingToken: boolean;
  embedPageUrl: string;
  submitting: boolean;
  onCopyUrl: () => void;
};

export const EmbedPublicUrl: FC<Props> = ({
  hasPublicUrl,
  pendingToken,
  embedPageUrl,
  submitting,
  onCopyUrl,
}) => {
  const { t } = useTypedTranslation();

  if (pendingToken) {
    return <Spin size="small" />;
  }

  if (!hasPublicUrl) {
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
    <Flex
      gap="small"
      align="center"
      justify="space-between"
      className="min-w-0 rounded border border-neutral-200 bg-white px-2! py-1!"
    >
      <AppNavLink
        to={embedPageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm break-all underline!"
        title={embedPageUrl}
      >
        {embedPageUrl}
      </AppNavLink>
      <Button
        type="text"
        size="small"
        icon={<CopyOutlined />}
        disabled={submitting}
        onClick={onCopyUrl}
        data-i18n-key="visualizer.embed.copyUrl"
      />
    </Flex>
  );
};
