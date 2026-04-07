import { type FC, useCallback, useRef, useState } from 'react';
import { Badge, Button, Flex, Input, Modal, Spin, Typography } from 'antd';
import { streamAiParse } from '@/api/ai';
import { selectSetVisualizerState } from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { IMPORT_DATA_TYPES } from '@/constants/data';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { commitParsedImport } from '@/helpers/commitParsedImport';
import { parseCSV } from '@/helpers/importDataParsers';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { showMessageWithClose } from '@/components/visualizer/ImportDataPanel/importDataPanelUtils';

// The assistant prefill sent to Claude; the response continues from this point.
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

const AiParserModal: FC<Props> = ({
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
  // outputText starts with the assistant prefill so the user sees the full tab-delimited output
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
    // Prepend the assistant prefill so the textarea shows the full tab-delimited output
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

  const footerButtons = (() => {
    if (phase === 'result') {
      return (
        <>
          <Button onClick={handleClose}>{t('nav.cancel')}</Button>
          <Button type="primary" onClick={handleApply}>
            {t('visualizer.save')}
          </Button>
        </>
      );
    }
    return (
      <>
        <Button onClick={handleClose}>{t('nav.cancel')}</Button>
        <Button
          type="primary"
          onClick={() => void handleSubmit()}
          loading={isStreaming}
          disabled={isStreaming || !inputText.trim()}
        >
          {isStreaming
            ? t('visualizer.aiParserModal.parsing')
            : t('visualizer.aiParserModal.submit')}
        </Button>
      </>
    );
  })();

  return (
    <Modal
      title={t('visualizer.aiParserModal.title')}
      open={open}
      onCancel={handleClose}
      closable
      maskClosable={false}
      footer={
        <Flex justify="flex-end" gap="small">
          {footerButtons}
        </Flex>
      }
      centered
      destroyOnHidden
      focusable={{ trap: false }}
    >
      <Flex vertical gap="small" className="py-md">
        <Flex justify="space-between" align="center">
          <Typography.Text type="secondary" className="text-xs">
            {t('visualizer.aiParserModal.limitedRequestsNote')}
          </Typography.Text>
          <Badge
            count={remaining}
            showZero
            color={remaining > 0 ? 'blue' : 'red'}
            size="small"
            title={t('visualizer.aiParserModal.requestsRemaining', { count: remaining })}
          />
        </Flex>
        {showOutput ? (
          <Flex vertical gap="xs">
            <Input.TextArea
              value={outputText}
              readOnly
              rows={14}
              className="resize-none font-mono text-sm"
            />
            {isStreaming && (
              <Flex justify="center">
                <Spin size="small" />
              </Flex>
            )}
          </Flex>
        ) : (
          <Input.TextArea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('visualizer.aiParserModal.placeholder')}
            rows={14}
            className="resize-none font-mono text-sm"
          />
        )}
      </Flex>
    </Modal>
  );
};

export default AiParserModal;
