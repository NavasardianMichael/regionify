import type { FC } from 'react';
import { CloseOutlined, DownloadOutlined } from '@ant-design/icons';
import type { App } from 'antd';
import { Button, Flex } from 'antd';

export type MessageWithSampleDownloadProps = {
  message: string;
  onDownloadSample: () => void;
  onClose: () => void;
  downloadLabel?: string;
};

/** Message content with a "Download sample" button and Close, for use in Ant Design message. */
export const MessageWithSampleDownload: FC<MessageWithSampleDownloadProps> = ({
  message,
  onDownloadSample,
  onClose,
  downloadLabel = 'Download sample',
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
      aria-label="Close"
    />
  </Flex>
);

export type MessageApi = ReturnType<App['useApp']>['message'];

/**
 * Shows an error/warning/info message with a "Download sample" button.
 * Use for format/ID/sample-related errors so the user can download sample data to get correct IDs and match labels.
 */
export function showMessageWithSampleDownload(
  messageApi: MessageApi,
  type: 'error' | 'warning' | 'info',
  message: string,
  onDownloadSample: () => void,
  options?: { downloadLabel?: string },
): void {
  const closeRef = { current: () => {} };
  closeRef.current = messageApi[type]({
    content: (
      <MessageWithSampleDownload
        message={message}
        onDownloadSample={onDownloadSample}
        onClose={() => closeRef.current()}
        downloadLabel={options?.downloadLabel}
      />
    ),
    duration: 0,
  }) as () => void;
}
