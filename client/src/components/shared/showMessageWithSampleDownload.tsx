import { MessageWithSampleDownload } from '@/components/shared/MessageWithSampleDownload';
import type { MessageApi } from '@/components/shared/useAppFeedback';

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
  messageApi[type]({
    content: (
      <MessageWithSampleDownload
        message={message}
        onDownloadSample={onDownloadSample}
        downloadLabel={options?.downloadLabel}
      />
    ),
    duration: 0,
  });
}
