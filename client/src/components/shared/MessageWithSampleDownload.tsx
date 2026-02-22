import type { FC } from 'react';
import { CloseOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';

export type MessageWithSampleDownloadProps = {
  message: string;
  onDownloadSample: () => void;
  onClose: () => void;
  downloadLabel?: string;
  closeLabel?: string;
};

/** Message content with a "Download sample" button and Close, for use in Ant Design message. */
export const MessageWithSampleDownload: FC<MessageWithSampleDownloadProps> = ({
  message,
  onDownloadSample,
  onClose,
  downloadLabel = 'Download sample',
  closeLabel = 'Close',
}) => (
  <Flex align="center" gap="small" style={{ alignItems: 'center' }}>
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
    <Button
      type="text"
      size="small"
      icon={<CloseOutlined />}
      onClick={onClose}
      style={{ padding: 0 }}
      aria-label={closeLabel}
    />
  </Flex>
);
