import { type FC, useCallback, useMemo, useRef, useState } from 'react';
import { ExperimentOutlined, TableOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Modal as AntModal, Tabs } from 'antd';
import { streamAiGenerate, streamAiParse } from '@/api/ai';
import {
  selectData,
  selectSetVisualizerState,
  selectTimelineData,
  selectTimePeriods,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { IMPORT_DATA_TYPES, MAX_AI_PARSE_REQUESTS_PER_DAY } from '@/constants/data';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { commitParsedImport } from '@/helpers/commitParsedImport';
import { datasetToTabDelimited, rowsToTabDelimited } from '@/helpers/datasetToTabDelimited';
import { parseCSV, type ParsedRow } from '@/helpers/importDataParsers';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { showMessageWithClose } from '@/components/visualizer/ImportDataPanel/importDataPanelUtils';
import bodyScrollbarStyles from '@/components/visualizer/modalBodyScrollbar.module.css';
import { AiTab } from './AiTab';
import { Footer } from './Footer';
import { TabHeader } from './TabHeader';
import tabsStyles from './Tabs.module.css';

const ASSISTANT_PREFILL = 'id\t';

type Phase = 'input' | 'streaming' | 'result' | 'error';
type ViewMode = 'ai' | 'table';
type Mode = 'parser' | 'generator';

type Props = {
  open: boolean;
  onClose: () => void;
  mapRegionIds: string[];
  countryName?: string;
  historicalDataImport: boolean;
  remaining: number;
  onRemainingChange: (count: number) => void;
};

const hasAnyTimeColumn = (rows: ParsedRow[]): boolean =>
  rows.some((r) => r.timePeriod !== undefined && r.timePeriod !== '');

const filterParsedRows = (rows: ParsedRow[]): ParsedRow[] =>
  rows.filter((r) => r.id.trim() && !Number.isNaN(r.value));

export const AiParserModal: FC<Props> = ({
  open,
  onClose,
  mapRegionIds,
  countryName,
  historicalDataImport,
  remaining,
  onRemainingChange,
}) => {
  const { t } = useTypedTranslation();
  const { message: messageApi } = useAppFeedback();

  const setVisualizerState = useVisualizerStore(selectSetVisualizerState);
  const data = useVisualizerStore(selectData);
  const timelineData = useVisualizerStore(selectTimelineData);
  const timePeriods = useVisualizerStore(selectTimePeriods);

  // Snapshot the dataset at modal open so the parser tab is prefilled with current data
  // and we can tell whether the user has dirtied it before saving.
  const [initialParserText] = useState(() =>
    datasetToTabDelimited(data, timelineData, timePeriods),
  );

  const [activeMode, setActiveMode] = useState<Mode>('parser');

  // ─── Parser tab state ───
  const [parserText, setParserText] = useState(initialParserText);
  const [parserRows, setParserRows] = useState<ParsedRow[]>([]);
  const [parserPhase, setParserPhase] = useState<Phase>('input');
  const [parserView, setParserView] = useState<ViewMode>('ai');
  const parserAbortRef = useRef<AbortController | null>(null);

  // ─── Generator tab state ───
  const [generatorPrompt, setGeneratorPrompt] = useState('');
  const [generatorOutput, setGeneratorOutput] = useState('');
  const [generatorRows, setGeneratorRows] = useState<ParsedRow[]>([]);
  const [generatorPhase, setGeneratorPhase] = useState<Phase>('input');
  const [generatorView, setGeneratorView] = useState<ViewMode>('ai');
  const generatorAbortRef = useRef<AbortController | null>(null);

  const isParserStreaming = parserPhase === 'streaming';
  const isGeneratorStreaming = generatorPhase === 'streaming';
  const isAnyStreaming = isParserStreaming || isGeneratorStreaming;

  const handleClose = useCallback(() => {
    parserAbortRef.current?.abort();
    generatorAbortRef.current?.abort();
    onClose();
  }, [onClose]);

  // ─── Parser submit ───
  const handleParserSubmit = useCallback(async () => {
    const trimmed = parserText.trim();
    if (!trimmed) return;

    setParserPhase('streaming');
    setParserText(ASSISTANT_PREFILL);

    const controller = new AbortController();
    parserAbortRef.current = controller;

    try {
      await streamAiParse(
        { text: trimmed, mapRegionIds },
        (delta) => setParserText((prev) => prev + delta),
        (count) => onRemainingChange(count),
        controller.signal,
      );
      setParserPhase('result');
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const message = err instanceof Error ? err.message : t('visualizer.aiParserModal.parseError');
      showMessageWithClose(messageApi, 'error', message);
      setParserPhase('error');
    }
  }, [parserText, mapRegionIds, onRemainingChange, messageApi, t]);

  // ─── Generator submit ───
  const handleGeneratorSubmit = useCallback(async () => {
    const trimmed = generatorPrompt.trim();
    if (!trimmed) return;

    setGeneratorPhase('streaming');
    setGeneratorOutput(ASSISTANT_PREFILL);
    setGeneratorRows([]);

    const controller = new AbortController();
    generatorAbortRef.current = controller;

    let buffer = ASSISTANT_PREFILL;

    try {
      await streamAiGenerate(
        { prompt: trimmed, mapRegionIds, countryName },
        (delta) => {
          buffer += delta;
          setGeneratorOutput(buffer);
        },
        (count) => onRemainingChange(count),
        controller.signal,
      );

      const parsed = parseCSV(buffer.trim());
      if (typeof parsed === 'object' && 'error' in parsed) {
        showMessageWithClose(messageApi, 'error', t('visualizer.tabDelimitedModal.pasteMissingId'));
        setGeneratorPhase('error');
        return;
      }

      const cleaned = filterParsedRows(parsed);
      if (cleaned.length === 0) {
        showMessageWithClose(
          messageApi,
          'warning',
          t('visualizer.aiParserModal.generatorEmptyResult'),
        );
        setGeneratorPhase('error');
        return;
      }

      setGeneratorRows(cleaned);
      setGeneratorView('table'); // auto-switch to table view on success
      setGeneratorPhase('result');
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const message =
        err instanceof Error ? err.message : t('visualizer.aiParserModal.generatorError');
      showMessageWithClose(messageApi, 'error', message);
      setGeneratorPhase('error');
    }
  }, [generatorPrompt, mapRegionIds, countryName, messageApi, onRemainingChange, t]);

  // ─── Parser switch view ───
  const handleParserSwitchView = useCallback(() => {
    if (parserView === 'ai') {
      const trimmed = parserText.trim();
      if (!trimmed) {
        setParserRows([]);
        setParserView('table');
        return;
      }
      const parsed = parseCSV(trimmed);
      if (typeof parsed === 'object' && 'error' in parsed) {
        showMessageWithClose(messageApi, 'error', t('visualizer.tabDelimitedModal.pasteMissingId'));
        return;
      }
      setParserRows(parsed);
      setParserView('table');
    } else {
      setParserText(rowsToTabDelimited(parserRows));
      setParserView('ai');
    }
  }, [messageApi, parserRows, parserText, parserView, t]);

  // ─── Generator switch view ───
  const handleGeneratorSwitchView = useCallback(() => {
    setGeneratorView((prev) => (prev === 'ai' ? 'table' : 'ai'));
  }, []);

  // ─── Apply (save) ───
  const handleApply = useCallback(() => {
    let parsed: ParsedRow[];

    if (activeMode === 'parser') {
      if (parserView === 'table') {
        parsed = filterParsedRows(parserRows);
      } else {
        const result = parseCSV(parserText.trim());
        if (typeof result === 'object' && 'error' in result) {
          showMessageWithClose(
            messageApi,
            'error',
            t('visualizer.tabDelimitedModal.pasteMissingId'),
          );
          return;
        }
        parsed = filterParsedRows(result);
      }
    } else {
      parsed = filterParsedRows(generatorRows);
    }

    if (parsed.length === 0) {
      showMessageWithClose(messageApi, 'error', t('visualizer.tabDelimitedModal.pasteFormatError'));
      return;
    }

    const outcome = commitParsedImport(parsed, mapRegionIds, historicalDataImport);
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
          t('messages.timeSeriesDetected', { badgeName: t('badges.items.chronographer.name') }),
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
  }, [
    activeMode,
    generatorRows,
    historicalDataImport,
    mapRegionIds,
    messageApi,
    onClose,
    parserRows,
    parserText,
    parserView,
    setVisualizerState,
    t,
  ]);

  // ─── Dirty tracking ───
  const parserCurrentSerialized = useMemo(
    () => (parserView === 'table' ? rowsToTabDelimited(parserRows) : parserText),
    [parserRows, parserText, parserView],
  );
  const isParserDirty = useMemo(() => {
    const trimmed = parserCurrentSerialized.trim();
    return trimmed.length > 0 && trimmed !== initialParserText.trim();
  }, [parserCurrentSerialized, initialParserText]);
  const isGeneratorDirty = generatorRows.length > 0;

  // ─── Inputs / has-content ───
  const parserHasInput = parserText.trim().length > 0;
  const generatorHasInput = generatorPrompt.trim().length > 0;

  // ─── Limit note (shared, single source of truth) ───
  const limitNote = t('visualizer.aiParserModal.limitedRequestsNote', {
    count: remaining,
    max: MAX_AI_PARSE_REQUESTS_PER_DAY,
  });

  // ─── Handlers passed to AiTab ───
  // Functional setState avoids stale closures on phase, so the handlers can stay
  // memoized with no dependencies.
  const handleParserTextChange = useCallback((value: string) => {
    setParserText(value);
    setParserPhase((prev) => (prev === 'result' || prev === 'error' ? 'input' : prev));
  }, []);

  const handleGeneratorTextChange = useCallback((value: string) => {
    setGeneratorPrompt(value);
    setGeneratorPhase((prev) => (prev === 'result' || prev === 'error' ? 'input' : prev));
  }, []);

  const tableLabels = useMemo(
    () => ({
      empty: t('visualizer.aiParserModal.tableEmpty'),
      addRow: t('visualizer.aiParserModal.tableAddRow'),
      columns: {
        id: t('visualizer.aiParserModal.columnId'),
        label: t('visualizer.aiParserModal.columnLabel'),
        value: t('visualizer.aiParserModal.columnValue'),
        time: t('visualizer.aiParserModal.columnTime'),
      },
    }),
    [t],
  );

  const parserHasTimeColumn = useMemo(() => hasAnyTimeColumn(parserRows), [parserRows]);
  const generatorHasTimeColumn = useMemo(() => hasAnyTimeColumn(generatorRows), [generatorRows]);

  const cancelLabel = t('nav.cancel');
  const saveLabel = t('visualizer.save');

  const parserFooter = useMemo(
    () => (
      <Footer
        isStreaming={isParserStreaming}
        hasInput={parserHasInput}
        isDirty={isParserDirty}
        cancelLabel={cancelLabel}
        saveLabel={saveLabel}
        parsingLabel={t('visualizer.aiParserModal.parsing')}
        submitLabel={t('visualizer.aiParserModal.submit')}
        submitIcon={<ThunderboltOutlined />}
        hideSubmit={parserView === 'table'}
        onClose={handleClose}
        onSubmit={() => void handleParserSubmit()}
        onApply={handleApply}
      />
    ),
    [
      cancelLabel,
      handleApply,
      handleClose,
      handleParserSubmit,
      isParserDirty,
      isParserStreaming,
      parserHasInput,
      parserView,
      saveLabel,
      t,
    ],
  );

  const generatorFooter = useMemo(
    () => (
      <Footer
        isStreaming={isGeneratorStreaming}
        hasInput={generatorHasInput}
        isDirty={isGeneratorDirty}
        cancelLabel={cancelLabel}
        saveLabel={saveLabel}
        parsingLabel={t('visualizer.aiParserModal.generatorParsing')}
        submitLabel={t('visualizer.aiParserModal.generatorSubmit')}
        submitIcon={<ExperimentOutlined />}
        hideSubmit={generatorView === 'table'}
        onClose={handleClose}
        onSubmit={() => void handleGeneratorSubmit()}
        onApply={handleApply}
      />
    ),
    [
      cancelLabel,
      generatorHasInput,
      generatorView,
      handleApply,
      handleClose,
      handleGeneratorSubmit,
      isGeneratorDirty,
      isGeneratorStreaming,
      saveLabel,
      t,
    ],
  );

  // While streaming, show the AI's raw response in the prompt textarea so the user
  // gets live feedback. Once the stream ends we auto-switch to table view, and the
  // textarea reverts to the original prompt.
  const generatorTextValue = isGeneratorStreaming ? generatorOutput : generatorPrompt;

  const tabItems = useMemo(
    () => [
      {
        key: 'parser',
        label: t('visualizer.aiParserModal.tabParser'),
        children: (
          <AiTab
            placeholder={t('visualizer.aiParserModal.placeholder')}
            textValue={parserText}
            onTextChange={handleParserTextChange}
            isStreaming={isParserStreaming}
            textareaDisabled={isParserStreaming}
            viewMode={parserView}
            rows={parserRows}
            onRowsChange={setParserRows}
            hasTimeColumn={parserHasTimeColumn}
            tableLabels={tableLabels}
            footer={parserFooter}
          />
        ),
      },
      {
        key: 'generator',
        label: t('visualizer.aiParserModal.tabGenerator'),
        children: (
          <AiTab
            placeholder={t('visualizer.aiParserModal.generatorPlaceholder')}
            textValue={generatorTextValue}
            onTextChange={handleGeneratorTextChange}
            isStreaming={isGeneratorStreaming}
            textareaDisabled={isGeneratorStreaming}
            viewMode={generatorView}
            rows={generatorRows}
            onRowsChange={setGeneratorRows}
            hasTimeColumn={generatorHasTimeColumn}
            tableLabels={tableLabels}
            footer={generatorFooter}
          />
        ),
      },
    ],
    [
      generatorFooter,
      generatorHasTimeColumn,
      generatorRows,
      generatorTextValue,
      generatorView,
      handleGeneratorTextChange,
      handleParserTextChange,
      isGeneratorStreaming,
      isParserStreaming,
      parserFooter,
      parserHasTimeColumn,
      parserRows,
      parserText,
      parserView,
      tableLabels,
      t,
    ],
  );

  const handleTabChange = useCallback((key: string) => {
    setActiveMode(key as Mode);
  }, []);

  // Shared header (limit note + switch view) lives above the tabs and operates
  // on whichever tab is currently active.
  const activeView = activeMode === 'parser' ? parserView : generatorView;
  const onActiveSwitchView =
    activeMode === 'parser' ? handleParserSwitchView : handleGeneratorSwitchView;

  const switchViewButton = useMemo(
    () => (
      <Button
        size="small"
        type="dashed"
        icon={activeView === 'ai' ? <TableOutlined /> : <ThunderboltOutlined />}
        onClick={onActiveSwitchView}
        disabled={isAnyStreaming}
      >
        {activeView === 'ai'
          ? t('visualizer.aiParserModal.switchToTable')
          : t('visualizer.aiParserModal.switchToAi')}
      </Button>
    ),
    [activeView, isAnyStreaming, onActiveSwitchView, t],
  );

  return (
    <AntModal
      title={t('visualizer.aiParserModal.title')}
      open={open}
      onCancel={handleClose}
      closable={{ disabled: isAnyStreaming }}
      keyboard={!isAnyStreaming}
      className={`${bodyScrollbarStyles.bodyScrollbar} w-4/5! max-w-[1000px]! lg:w-2/3!`}
      classNames={{
        container: 'max-h-[90vh]',
        body: 'min-h-0 h-[calc(90vh-140px)] flex flex-col gap-3',
      }}
      maskClosable={false}
      footer={null}
      centered
      destroyOnHidden
      focusable={{ trap: false }}
      data-i18n-key="visualizer.aiParserModal.title"
    >
      <TabHeader note={limitNote} switchViewButton={switchViewButton} />
      <Tabs
        type="card"
        activeKey={activeMode}
        onChange={handleTabChange}
        items={tabItems}
        className={tabsStyles.tabs}
      />
    </AntModal>
  );
};
