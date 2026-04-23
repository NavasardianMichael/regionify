import { type ChangeEvent, type FC } from 'react';
import { DownloadOutlined, LinkOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type BodyProps = {
  url: string;
  busy: boolean;
  isValidUrl: boolean;
  error: string | null;
  loadingMode: 'sync' | 'snapshot' | null;
  onUrlChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onImportSync: () => void;
  onImportSnapshot: () => void;
};

export const Body: FC<BodyProps> = ({
  url,
  busy,
  isValidUrl,
  error,
  loadingMode,
  onUrlChange,
  onImportSync,
  onImportSnapshot,
}) => {
  const { t } = useTypedTranslation();

  return (
    <Flex vertical gap="middle" className="py-2">
      <Typography.Text
        className="text-sm text-gray-600"
        data-i18n-key="visualizer.googleSheets.intro"
      >
        {t('visualizer.googleSheets.intro')}
      </Typography.Text>

      <Input
        placeholder={t('visualizer.googleSheets.placeholder')}
        value={url}
        onChange={onUrlChange}
        disabled={busy}
        status={error ? 'error' : undefined}
        allowClear
        data-i18n-key="visualizer.googleSheets.placeholder"
      />

      {error && (
        <Typography.Text
          type="danger"
          className="text-xs"
          data-i18n-key="visualizer.googleSheets.fetchFailed"
        >
          {error}
        </Typography.Text>
      )}

      <Flex vertical gap={4} className="rounded-md bg-gray-50 p-3!">
        <Typography.Text
          className="text-xs font-medium text-gray-500"
          data-i18n-key="visualizer.googleSheets.howToShare"
        >
          {t('visualizer.googleSheets.howToShare')}
        </Typography.Text>
        <ol className="m-0 space-y-1 text-xs text-gray-500">
          <li data-i18n-key="visualizer.googleSheets.stepOpen">
            {t('visualizer.googleSheets.stepOpen')}
          </li>
          <li data-i18n-key="visualizer.googleSheets.stepShare">
            {t('visualizer.googleSheets.stepShare')}
          </li>
          <li data-i18n-key="visualizer.googleSheets.stepAnyone">
            {t('visualizer.googleSheets.stepAnyone')}
          </li>
          <li data-i18n-key="visualizer.googleSheets.stepPaste">
            {t('visualizer.googleSheets.stepPaste')}
          </li>
        </ol>
      </Flex>

      <Flex gap="small" wrap="wrap" className="w-full">
        <Button
          type="default"
          icon={<LinkOutlined />}
          onClick={onImportSync}
          loading={busy && loadingMode === 'sync'}
          disabled={!isValidUrl || busy}
          className="min-w-[160px] grow"
          data-i18n-key="visualizer.googleSheets.syncButton"
        >
          {busy && loadingMode === 'sync'
            ? t('visualizer.googleSheets.fetching')
            : t('visualizer.googleSheets.syncButton')}
        </Button>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={onImportSnapshot}
          loading={busy && loadingMode === 'snapshot'}
          disabled={!isValidUrl || busy}
          className="min-w-[160px] grow"
          data-i18n-key="visualizer.googleSheets.importOnceButton"
        >
          {busy && loadingMode === 'snapshot'
            ? t('visualizer.googleSheets.fetching')
            : t('visualizer.googleSheets.importOnceButton')}
        </Button>
      </Flex>
    </Flex>
  );
};
