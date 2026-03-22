import type { FC } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';

export type MessageWithSampleDownloadProps = {
  message: string;
  onDownloadSample: () => void;
  downloadLabel?: string;
};

/** Message content with a "Download sample" action; dismissal uses the global message close control. */
export const MessageWithSampleDownload: FC<MessageWithSampleDownloadProps> = ({
  message,
  onDownloadSample,
  downloadLabel = 'Download sample',
}) => (
  <Flex align="center" gap="small" wrap="wrap" style={{ alignItems: 'center' }}>
    <span>{message}</span>
    <Button
      type="link"
      size="small"
      icon={<DownloadOutlined />}
      onClick={onDownloadSample}
      style={{ padding: 0 }}
    >
      {downloadLabel}
    </Button>
  </Flex>
);
