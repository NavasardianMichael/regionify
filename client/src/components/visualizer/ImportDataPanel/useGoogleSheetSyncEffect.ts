import { type MutableRefObject, useEffect } from 'react';
import type { MessageInstance } from 'antd/es/message/interface';
import { fetchGoogleSheet } from '@/api/sheets';
import type { VisualizerState } from '@/store/mapData/types';
import type { ImportDataType } from '@/types/mapData';
import { IMPORT_DATA_TYPES } from '@/constants/data';
import { showMessageWithClose } from './importDataPanelUtils';

type Params = {
  importDataType: ImportDataType;
  googleUrl: string | null;
  selectedCountryId: string | null;
  svgTitles: string[];
  setVisualizerState: (data: Partial<VisualizerState>) => void;
  messageApi: MessageInstance;
  afterSheetCsvParsedRef: MutableRefObject<(csv: string) => void>;
  skipSheetsRefetchOnceRef: MutableRefObject<boolean>;
  fetchFailedMessage: string;
};

/**
 * When import type is Google Sheets sync, refetches CSV from the stored URL when deps change.
 */
export function useGoogleSheetSyncEffect({
  importDataType,
  googleUrl,
  selectedCountryId,
  svgTitles,
  setVisualizerState,
  messageApi,
  afterSheetCsvParsedRef,
  skipSheetsRefetchOnceRef,
  fetchFailedMessage,
}: Params): void {
  useEffect(() => {
    if (importDataType !== IMPORT_DATA_TYPES.sheets) {
      setVisualizerState({ isGoogleSheetSyncLoading: false });
      return;
    }

    const canRun = Boolean(googleUrl) && Boolean(selectedCountryId) && svgTitles.length > 0;

    if (skipSheetsRefetchOnceRef.current) {
      skipSheetsRefetchOnceRef.current = false;
      if (!canRun) return;
      return;
    }

    if (!canRun || !googleUrl) return;

    const sheetUrl = googleUrl;

    setVisualizerState({ isGoogleSheetSyncLoading: true });
    let cancelled = false;
    void (async () => {
      try {
        const csv = await fetchGoogleSheet({ url: sheetUrl });
        if (cancelled) return;
        afterSheetCsvParsedRef.current(csv);
      } catch {
        if (!cancelled) {
          showMessageWithClose(messageApi, 'error', fetchFailedMessage);
        }
      } finally {
        if (!cancelled) {
          setVisualizerState({ isGoogleSheetSyncLoading: false });
        }
      }
    })();

    return () => {
      cancelled = true;
      setVisualizerState({ isGoogleSheetSyncLoading: false });
    };
  }, [
    googleUrl,
    importDataType,
    messageApi,
    selectedCountryId,
    setVisualizerState,
    svgTitles,
    fetchFailedMessage,
    afterSheetCsvParsedRef,
    skipSheetsRefetchOnceRef,
  ]);
}
