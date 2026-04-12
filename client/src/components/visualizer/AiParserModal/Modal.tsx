import { type FC, useCallback, useRef, useState } from 'react';
import { Modal as AntModal } from 'antd';
import { streamAiParse } from '@/api/ai';
import { selectSetVisualizerState } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { IMPORT_DATA_TYPES, MAX_AI_PARSE_REQUESTS_PER_DAY } from '@/constants/data';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { commitParsedImport } from '@/helpers/commitParsedImport';
import { parseCSV } from '@/helpers/importDataParsers';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { showMessageWithClose } from '@/components/visualizer/ImportDataPanel/importDataPanelUtils';
import bodyScrollbarStyles from '@/components/visualizer/modalBodyScrollbar.module.css';
import { Body } from './Body';
import { Footer } from './Footer';

const ASSISTANT_PREFILL = 'id\t';

type Phase = 'input' | 'streaming' | 'result' | 'error';

type Props = {
  open: boolean;
  onClose: () => void;
  mapRegionIds: string[];
  historicalDataImport: boolean;
  remaining: number;
  onRemainingChange: (count: number) => void;
};

export const AiParserModal: FC<Props> = ({
  open,
  onClose,
  mapRegionIds,
  historicalDataImport,
  remaining,
  onRemainingChange,
}) => {
  const { t } = useTypedTranslation();
  const { message: messageApi } = useAppFeedback();

  const setVisualizerState = useVisualizerStore(selectSetVisualizerState);

  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [phase, setPhase] = useState<Phase>('input');

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleClose = useCallback(() => {
    abortControllerRef.current?.abort();
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    setPhase('streaming');
    setOutputText(ASSISTANT_PREFILL);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await streamAiParse(
        { text: trimmed, mapRegionIds },
        (delta) => setOutputText((prev) => prev + delta),
        (count) => onRemainingChange(count),
        controller.signal,
      );
      setPhase('result');
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const message = err instanceof Error ? err.message : t('visualizer.aiParserModal.parseError');
      showMessageWithClose(messageApi, 'error', message);
      setPhase('error');
    }
  }, [inputText, mapRegionIds, onRemainingChange, messageApi, t]);

  const handleApply = useCallback(() => {
    const trimmed = outputText.trim();

    const result = parseCSV(trimmed);
    if (typeof result === 'object' && 'error' in result) {
      showMessageWithClose(messageApi, 'error', t('visualizer.tabDelimitedModal.pasteMissingId'));
      return;
    }
    if (result.length === 0) {
      showMessageWithClose(messageApi, 'error', t('visualizer.tabDelimitedModal.pasteFormatError'));
      return;
    }

    const outcome = commitParsedImport(result, mapRegionIds, historicalDataImport);
    if (!outcome.ok) {
      showMessageWithClose(messageApi, 'error', t('visualizer.tabDelimitedModal.pasteFormatError'));
      return;
    }

    if (outcome.variant === 'timeline') {
      showMessageWithClose(
        messageApi,
        'success',
        t('messages.importedRowsPeriods', {
          count: outcome.rowCount,
          periods: outcome.periodCount,
        }),
      );
    } else {
      if (outcome.sideEffect === 'info_time_on_observer') {
        showMessageWithClose(
          messageApi,
          'info',
          t('messages.timeSeriesDetected', { planName: t('plans.items.chronographer.name') }),
        );
      }
      if (outcome.sideEffect === 'warn_no_time_chronographer') {
        showMessageWithClose(messageApi, 'warning', t('messages.noTimeColumnDetected'));
      }
      showMessageWithClose(
        messageApi,
        'success',
        t('messages.importedRegions', { count: outcome.rowCount }),
      );
    }

    setVisualizerState({ importDataType: IMPORT_DATA_TYPES.aiParser });
    onClose();
  }, [outputText, mapRegionIds, historicalDataImport, messageApi, setVisualizerState, onClose, t]);

  const isStreaming = phase === 'streaming';
  const showOutput = phase === 'streaming' || phase === 'result';

  return (
    <AntModal
      title={t('visualizer.aiParserModal.title')}
      open={open}
      onCancel={handleClose}
      closable
      className={bodyScrollbarStyles.bodyScrollbar}
      maskClosable={false}
      footer={
        <Footer
          phase={phase}
          isStreaming={isStreaming}
          hasInput={Boolean(inputText.trim())}
          cancelLabel={t('nav.cancel')}
          saveLabel={t('visualizer.save')}
          parsingLabel={t('visualizer.aiParserModal.parsing')}
          submitLabel={t('visualizer.aiParserModal.submit')}
          onClose={handleClose}
          onSubmit={handleSubmit}
          onApply={handleApply}
        />
      }
      centered
      destroyOnHidden
      focusable={{ trap: false }}
      data-i18n-key="visualizer.aiParserModal.title"
    >
      <Body
        limitedRequestsNote={t('visualizer.aiParserModal.limitedRequestsNote', {
          count: remaining,
          max: MAX_AI_PARSE_REQUESTS_PER_DAY,
        })}
        placeholder={t('visualizer.aiParserModal.placeholder')}
        inputText={inputText}
        onInputChange={setInputText}
        showOutput={showOutput}
        outputText={outputText}
        isStreaming={isStreaming}
      />
    </AntModal>
  );
};
