import type { App } from 'antd';
import { MessageWithSampleDownload } from '@/components/shared/MessageWithSampleDownload';

export type MessageApi = ReturnType<typeof App.useApp>['message'];

/**
 * Shows an error/warning/info message with a "Download sample" button.
 * Use for format/ID/sample-related errors so the user can download sample data to get correct IDs and match labels.
 */
export function showMessageWithSampleDownload(
  messageApi: MessageApi,
  type: 'error' | 'warning' | 'info',
  message: string,
  onDownloadSample: () => void,
  options?: { downloadLabel?: string; closeLabel?: string },
): void {
  const closeRef = { current: () => {} };
  closeRef.current = messageApi[type]({
    content: (
      <MessageWithSampleDownload
        message={message}
        onDownloadSample={onDownloadSample}
        onClose={() => closeRef.current()}
        downloadLabel={options?.downloadLabel}
        closeLabel={options?.closeLabel}
      />
    ),
    duration: 0,
  }) as () => void;
}
