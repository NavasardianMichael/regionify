import {
  type Key,
  type MouseEvent,
  startTransition,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { MenuProps } from 'antd';
import {
  selectClearTimelineData,
  selectData,
  selectSetTimelineData,
  selectSetVisualizerState,
  selectTimelineData,
  selectTimePeriods,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import type { DataSet, RegionData } from '@/store/mapData/types';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import {
  buildInitialRows,
  createEmptyStaticRow,
  type DataRow,
  findFirstMissingDataSlot,
  hasDuplicateManualEntryRows,
  isTimelineManualEntryMode,
  manualEntryRowKeyStatic,
  manualEntryRowKeyTimeline,
  mergeVisibleRowReorder,
} from '@/helpers/manualDataEntryHelpers';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { sortTableData } from './sort';
import { type ColumnFilters, EMPTY_FILTERS, type MiddleColKey } from './types';

type UseModalStateArgs = {
  mapRegionIds: string[];
  historicalDataImport: boolean;
  googleSheetsSyncReadOnly?: boolean;
  onSave?: () => void;
  onClose: () => void;
};

export function useModalState({
  mapRegionIds,
  historicalDataImport,
  googleSheetsSyncReadOnly = false,
  onSave,
  onClose,
}: UseModalStateArgs) {
  const { t } = useTypedTranslation();
  const { message: messageApi } = useAppFeedback();
  const storeData = useVisualizerStore(selectData);
  const timelineData = useVisualizerStore(selectTimelineData);
  const timePeriods = useVisualizerStore(selectTimePeriods);
  const setVisualizerState = useVisualizerStore(selectSetVisualizerState);
  const setTimelineData = useVisualizerStore(selectSetTimelineData);
  const clearTimelineData = useVisualizerStore(selectClearTimelineData);

  const [rows, setRows] = useState<DataRow[]>(() =>
    buildInitialRows(storeData, timelineData, timePeriods, historicalDataImport),
  );
  const [isTimelineMode] = useState(() =>
    isTimelineManualEntryMode(timelineData, timePeriods, historicalDataImport),
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({ ...EMPTY_FILTERS });
  const columnFiltersRef = useRef(columnFilters);
  useLayoutEffect(() => {
    columnFiltersRef.current = columnFilters;
  }, [columnFilters]);

  const [sortedInfo, setSortedInfo] = useState<{
    field?: string;
    order?: 'ascend' | 'descend';
  }>({});
  const middleColOrder = useMemo<MiddleColKey[]>(
    () => (isTimelineMode ? ['id', 'label', 'value', 'time'] : ['id', 'label', 'value']),
    [isTimelineMode],
  );

  const canAddMissing = useMemo(
    () =>
      mapRegionIds.length > 0 &&
      findFirstMissingDataSlot(rows, mapRegionIds, isTimelineMode, timePeriods) !== null,
    [rows, mapRegionIds, isTimelineMode, timePeriods],
  );

  const placeholderRegionId = t('visualizer.manualEntry.placeholderRegionId');
  const placeholderLabel = t('visualizer.manualEntry.placeholderLabel');

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const idQ = columnFilters.id.trim().toLowerCase();
      if (idQ && !r.id.toLowerCase().includes(idQ)) return false;
      const labelQ = columnFilters.label.trim().toLowerCase();
      if (labelQ && !r.label.toLowerCase().includes(labelQ)) return false;
      const valueQ = columnFilters.value.trim();
      if (valueQ && !String(r.value).includes(valueQ)) return false;
      const timeQ = columnFilters.time.trim().toLowerCase();
      if (timeQ && !(r.timePeriod ?? '').toLowerCase().includes(timeQ)) return false;
      return true;
    });
  }, [rows, columnFilters]);

  const tableData = useMemo(
    () => sortTableData(filteredRows, sortedInfo.field, sortedInfo.order),
    [filteredRows, sortedInfo],
  );

  const visibleRowKeys = useMemo(() => tableData.map((r) => r.key), [tableData]);
  const selectedVisibleCount = useMemo(
    () => selectedRowKeys.filter((k) => visibleRowKeys.includes(String(k))).length,
    [selectedRowKeys, visibleRowKeys],
  );

  const handleAddMissingRow = useCallback(() => {
    startTransition(() => {
      setRows((prev) => {
        const slot = findFirstMissingDataSlot(prev, mapRegionIds, isTimelineMode, timePeriods);
        if (!slot) return prev;
        const existing = prev.find((r) => r.id === slot.id);
        const labelReuse =
          existing?.label != null && existing.label.trim() !== '' ? existing.label : slot.id;
        const base: DataRow = {
          key:
            slot.kind === 'timeline'
              ? manualEntryRowKeyTimeline(slot.timePeriod, slot.id)
              : manualEntryRowKeyStatic(slot.id),
          id: slot.id,
          label: labelReuse,
          value: 0,
        };
        const nextRow: DataRow =
          slot.kind === 'timeline' ? { ...base, timePeriod: slot.timePeriod } : base;
        return [...prev, nextRow];
      });
    });
  }, [mapRegionIds, isTimelineMode, timePeriods]);

  const handleToggleChartVisibility = useCallback((rowKey: string) => {
    startTransition(() => {
      setRows((prev) =>
        prev.map((r) => (r.key === rowKey ? { ...r, hidden: r.hidden !== true } : r)),
      );
    });
  }, []);

  const patchLabel = useCallback((rowKey: string, nextLabel: string) => {
    setRows((prev) => {
      const row = prev.find((r) => r.key === rowKey);
      if (row != null && row.label === nextLabel) return prev;
      return prev.map((r) => (r.key === rowKey ? { ...r, label: nextLabel } : r));
    });
  }, []);

  const handleValueChange = useCallback((rowKey: string, value: number | null) => {
    const next = value ?? 0;
    setRows((prev) => {
      const row = prev.find((r) => r.key === rowKey);
      if (row != null && row.value === next) return prev;
      return prev.map((r) => (r.key === rowKey ? { ...r, value: next } : r));
    });
  }, []);

  const handleDeleteRow = useCallback(
    (rowKey: string) => {
      startTransition(() => {
        setRows((prev) => {
          const next = prev.filter((r) => r.key !== rowKey);
          if (next.length === 0) {
            const defaultTime = timePeriods.length > 0 ? timePeriods[0] : undefined;
            return [
              {
                ...createEmptyStaticRow(),
                ...(isTimelineMode ? { timePeriod: defaultTime ?? '' } : {}),
              },
            ];
          }
          return next;
        });
      });
      setSelectedRowKeys((keys) => keys.filter((k) => k !== rowKey));
    },
    [isTimelineMode, timePeriods],
  );

  const regionEntryFromRow = useCallback((r: DataRow): RegionData => {
    const id = r.id.trim();
    const label = r.label.trim();
    if (r.hidden === true) {
      return { id, label, value: r.value, hidden: true };
    }
    return { id, label, value: r.value };
  }, []);

  const handleApplyData = useCallback(() => {
    const valid = rows.filter(
      (r) =>
        r.id.trim() !== '' &&
        r.label.trim() !== '' &&
        (!isTimelineMode || (r.timePeriod != null && r.timePeriod.trim() !== '')),
    );

    if (valid.length === 0) {
      clearTimelineData();
      setVisualizerState({ data: { allIds: [], byId: {} } });
      onSave?.();
      onClose();
      return;
    }

    if (hasDuplicateManualEntryRows(valid, isTimelineMode)) {
      messageApi.warning(
        isTimelineMode
          ? t('visualizer.manualEntry.duplicateRowsTimeline')
          : t('visualizer.manualEntry.duplicateRowsStatic'),
      );
      return;
    }

    if (isTimelineMode) {
      const byPeriod = new Map<string, DataRow[]>();
      for (const r of valid) {
        const period = (r.timePeriod ?? '').trim();
        if (!byPeriod.has(period)) byPeriod.set(period, []);
        byPeriod.get(period)!.push(r);
      }
      const periods = Array.from(byPeriod.keys()).sort();
      const newTimelineData: Record<string, DataSet> = {};
      for (const period of periods) {
        const entries = byPeriod.get(period)!;
        const allIds = entries.map((e) => e.id.trim());
        const byId: Record<string, RegionData> = {};
        for (const e of entries) {
          const rd = regionEntryFromRow(e);
          byId[rd.id] = rd;
        }
        newTimelineData[period] = { allIds, byId };
      }
      setTimelineData(newTimelineData, periods);
    } else {
      clearTimelineData();
      const allIds = valid.map((r) => r.id.trim());
      const byId = Object.fromEntries(valid.map((r) => [r.id.trim(), regionEntryFromRow(r)]));
      setVisualizerState({ data: { allIds, byId } });
    }

    onSave?.();
    onClose();
  }, [
    rows,
    isTimelineMode,
    clearTimelineData,
    setVisualizerState,
    setTimelineData,
    regionEntryFromRow,
    messageApi,
    t,
    onSave,
    onClose,
  ]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const onRowReorder = useCallback(
    (keysInNewOrder: string[]) => {
      const nextVisible = keysInNewOrder
        .map((k) => tableData.find((r) => r.key === k)!)
        .filter(Boolean);
      if (nextVisible.length !== tableData.length) return;
      startTransition(() => {
        setRows((prev) => mergeVisibleRowReorder(prev, nextVisible));
      });
    },
    [tableData],
  );

  const bulkRemoveSelected = useCallback(() => {
    if (selectedRowKeys.length === 0) return;
    const sel = new Set(selectedRowKeys.map(String));
    startTransition(() => {
      setRows((prev) => {
        const next = prev.filter((r) => !sel.has(r.key));
        if (next.length === 0) {
          const defaultTime = timePeriods.length > 0 ? timePeriods[0] : undefined;
          return [
            {
              ...createEmptyStaticRow(),
              ...(isTimelineMode ? { timePeriod: defaultTime ?? '' } : {}),
            },
          ];
        }
        return next;
      });
    });
    setSelectedRowKeys([]);
  }, [selectedRowKeys, isTimelineMode, timePeriods]);

  const bulkHideSelected = useCallback(() => {
    if (selectedRowKeys.length === 0) return;
    const sel = new Set(selectedRowKeys.map(String));
    startTransition(() => {
      setRows((prev) => prev.map((r) => (sel.has(r.key) ? { ...r, hidden: true } : r)));
    });
  }, [selectedRowKeys]);

  const bulkShowSelected = useCallback(() => {
    if (selectedRowKeys.length === 0) return;
    const sel = new Set(selectedRowKeys.map(String));
    startTransition(() => {
      setRows((prev) => prev.map((r) => (sel.has(r.key) ? { ...r, hidden: false } : r)));
    });
  }, [selectedRowKeys]);

  const bulkMenuItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'remove',
        label: t('visualizer.manualEntry.bulkRemoveSelected'),
        danger: true,
        disabled: selectedRowKeys.length === 0,
      },
      {
        key: 'hide',
        label: t('visualizer.manualEntry.bulkHideSelected'),
        disabled: selectedRowKeys.length === 0,
      },
      {
        key: 'show',
        label: t('visualizer.manualEntry.bulkShowSelected'),
        disabled: selectedRowKeys.length === 0,
      },
    ],
    [t, selectedRowKeys.length],
  );

  const onBulkMenuClick: NonNullable<MenuProps['onClick']> = useCallback(
    (info: { key: string }) => {
      const { key } = info;
      if (selectedRowKeys.length === 0) return;
      if (key === 'remove') bulkRemoveSelected();
      else if (key === 'hide') bulkHideSelected();
      else if (key === 'show') bulkShowSelected();
    },
    [selectedRowKeys.length, bulkRemoveSelected, bulkHideSelected, bulkShowSelected],
  );

  const onActionsClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const rowKey = e.currentTarget.dataset.rowkey;
      const action = e.currentTarget.dataset.action;
      if (!rowKey || !action) return;
      if (action === 'toggleChart') handleToggleChartVisibility(rowKey);
      else if (action === 'delete') handleDeleteRow(rowKey);
    },
    [handleToggleChartVisibility, handleDeleteRow],
  );

  const filterDropdownProps = useMemo(
    () => ({
      autoFocus: true,
      getPopupContainer: (triggerNode: HTMLElement): HTMLElement => {
        const root = triggerNode.closest('.ant-modal-content');
        return root instanceof HTMLElement ? root : document.body;
      },
    }),
    [],
  );

  return {
    t,
    isTimelineMode,
    middleColOrder,
    googleSheetsSyncReadOnly,
    selectedRowKeys,
    setSelectedRowKeys,
    columnFilters,
    setColumnFilters,
    columnFiltersRef,
    sortedInfo,
    setSortedInfo,
    tableData,
    visibleRowKeys,
    selectedVisibleCount,
    canAddMissing,
    placeholderRegionId,
    placeholderLabel,
    handleAddMissingRow,
    patchLabel,
    handleValueChange,
    handleApplyData,
    handleCancel,
    onRowReorder,
    bulkMenuItems,
    onBulkMenuClick,
    onActionsClick,
    filterDropdownProps,
  };
}

export type ModalState = ReturnType<typeof useModalState>;
