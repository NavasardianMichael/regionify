import { type ChangeEvent, type FC, useCallback, useEffect, useState } from 'react';
import { Modal as AntModal } from 'antd';
import { fetchGoogleSheet } from '@/api/sheets';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { Body } from './Body';
import { Title } from './Title';
import type { GoogleSheetImportMode } from './types';

type Props = {
  open: boolean;
  onClose: () => void;
  onImport: (payload: { csv: string; url: string; mode: GoogleSheetImportMode }) => void;
  initialUrl?: string | null;
};

const GOOGLE_SHEETS_URL_REGEX = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+/;

export const GoogleSheetsModal: FC<Props> = ({ open, onClose, onImport, initialUrl }) => {
  const { t } = useTypedTranslation();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<GoogleSheetImportMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setUrl((initialUrl ?? '').trim());
    setError(null);
  }, [open, initialUrl]);

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
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(t('visualizer.googleSheets.fetchFailed'));
        }
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

  const handleUrlChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null);
  }, []);

  return (
    <AntModal
      className="scrollbar-modal-host"
      title={<Title />}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={500}
      destroyOnHidden
      maskClosable={false}
      keyboard={!busy}
      closable={{ disabled: busy }}
      centered
    >
      <Body
        url={url}
        busy={busy}
        isValidUrl={isValidUrl}
        error={error}
        loadingMode={loadingMode}
        onUrlChange={handleUrlChange}
        onImportSync={() => void runImport('sync')}
        onImportSnapshot={() => void runImport('snapshot')}
      />
    </AntModal>
  );
};
