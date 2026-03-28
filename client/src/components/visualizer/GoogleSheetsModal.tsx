import { type ChangeEvent, type FC, useCallback, useState } from 'react';
import { DownloadOutlined, LinkOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Modal, Typography } from 'antd';
import { fetchGoogleSheet } from '@/api/sheets';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

export type GoogleSheetImportMode = 'sync' | 'snapshot';

type Props = {
  open: boolean;
  onClose: () => void;
  onImport: (payload: { csv: string; url: string; mode: GoogleSheetImportMode }) => void;
};

const GOOGLE_SHEETS_URL_REGEX = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+/;

const GoogleSheetsModal: FC<Props> = ({ open, onClose, onImport }) => {
  const { t } = useTypedTranslation();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<GoogleSheetImportMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = GOOGLE_SHEETS_URL_REGEX.test(url.trim());
  const busy = isLoading;

  const runImport = useCallback(
    async (mode: GoogleSheetImportMode) => {
      if (!isValidUrl) return;

      setIsLoading(true);
      setLoadingMode(mode);
      setError(null);

      try {
        const trimmed = url.trim();
        const csv = await fetchGoogleSheet({ url: trimmed });
        onImport({ csv, url: trimmed, mode });
        setUrl('');
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('visualizer.googleSheets.fetchFailed'));
      } finally {
        setIsLoading(false);
        setLoadingMode(null);
      }
    },
    [isValidUrl, onImport, onClose, t, url],
  );

  const handleCancel = useCallback(() => {
    if (busy) return;
    setUrl('');
    setError(null);
    onClose();
  }, [busy, onClose]);

  return (
    <Modal
      title={
        <Flex align="center" gap="small" className="mb-4!">
          <LinkOutlined className="text-primary" />
          <Typography.Title level={4} className="mb-0!">
            {t('visualizer.googleSheets.title')}
          </Typography.Title>
        </Flex>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={500}
      destroyOnHidden
      maskClosable={false}
      keyboard={!busy}
      closable={{ disabled: busy }}
    >
      <Flex vertical gap="middle" className="py-2">
        <Typography.Text className="text-sm text-gray-600">
          {t('visualizer.googleSheets.intro')}
        </Typography.Text>

        <Input
          placeholder={t('visualizer.googleSheets.placeholder')}
          value={url}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setUrl(e.target.value);
            setError(null);
          }}
          disabled={busy}
          status={error ? 'error' : undefined}
          allowClear
        />

        {error && (
          <Typography.Text type="danger" className="text-xs">
            {error}
          </Typography.Text>
        )}

        <Flex vertical gap={4} className="rounded-md bg-gray-50 p-3!">
          <Typography.Text className="text-xs font-medium text-gray-500">
            {t('visualizer.googleSheets.howToShare')}
          </Typography.Text>
          <ol className="m-0 space-y-1 text-xs text-gray-500">
            <li>{t('visualizer.googleSheets.stepOpen')}</li>
            <li>{t('visualizer.googleSheets.stepShare')}</li>
            <li>{t('visualizer.googleSheets.stepAnyone')}</li>
            <li>{t('visualizer.googleSheets.stepPaste')}</li>
          </ol>
        </Flex>

        <Flex gap="small" wrap="wrap" className="w-full">
          <Button
            type="default"
            icon={<LinkOutlined />}
            onClick={() => void runImport('sync')}
            loading={busy && loadingMode === 'sync'}
            disabled={!isValidUrl || busy}
            className="min-w-[160px] grow"
          >
            {busy && loadingMode === 'sync'
              ? t('visualizer.googleSheets.fetching')
              : t('visualizer.googleSheets.syncButton')}
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => void runImport('snapshot')}
            loading={busy && loadingMode === 'snapshot'}
            disabled={!isValidUrl || busy}
            className="min-w-[160px] grow"
          >
            {busy && loadingMode === 'snapshot'
              ? t('visualizer.googleSheets.fetching')
              : t('visualizer.googleSheets.importOnceButton')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default GoogleSheetsModal;
