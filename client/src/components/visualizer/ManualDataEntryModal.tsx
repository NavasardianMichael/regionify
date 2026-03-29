import {
  type ChangeEvent,
  type FC,
  type KeyboardEvent,
  startTransition,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  HolderOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { DndContext } from '@dnd-kit/core';
import type { TableColumnType, TablePaginationConfig, TableProps } from 'antd';
import {
  Button,
  Flex,
  Input,
  InputNumber,
  type InputProps,
  type InputRef,
  Modal,
  type ModalProps,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import type {
  FilterDropdownProps,
  FilterValue,
  SorterResult,
  TableCurrentDataSource,
} from 'antd/es/table/interface';
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
import { generateRandomId } from '@/helpers/common';
import {
  buildInitialRows,
  compareTimePeriodForSort,
  createEmptyStaticRow,
  type DataRow,
  findFirstMissingDataSlot,
  hasDuplicateManualEntryRows,
  isManualEntryRowMatchedToExpected,
  isTimelineManualEntryMode,
  mergeVisibleRowReorder,
} from '@/helpers/manualDataEntryHelpers';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import {
  createSortableTbodyWrapper,
  SortableBodyRow,
  useManualEntryTableDnd,
} from '@/components/visualizer/ManualDataEntryModal/manualEntryTableDnD';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
  mapRegionIds: string[];
  historicalDataImport: boolean;
};

type ColumnFilterKey = 'id' | 'label' | 'value' | 'time';

type ColumnFilters = Record<ColumnFilterKey, string>;

function sortTableData(
  data: DataRow[],
  field: string | undefined,
  order: 'ascend' | 'descend' | null | undefined,
): DataRow[] {
  if (!field || !order) return data;
  const dir = order === 'ascend' ? 1 : -1;
  const mult = dir;
  return [...data].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'id':
        cmp = a.id.trim().localeCompare(b.id.trim(), undefined, { numeric: true });
        break;
      case 'label':
        cmp = a.label.trim().localeCompare(b.label.trim(), undefined, { numeric: true });
        break;
      case 'value':
        cmp = a.value - b.value;
        break;
      case 'time':
        cmp = compareTimePeriodForSort(a.timePeriod, b.timePeriod);
        break;
      default:
        cmp = 0;
    }
    return cmp * mult;
  });
}

const EMPTY_FILTERS: ColumnFilters = { id: '', label: '', value: '', time: '' };

type ManualEntryFilterSearchProps = {
  visible: boolean;
  value: string;
  placeholder: string;
  onValueChange: (value: string) => void;
};

/**
 * Ant Design filter dropdown search field: default Input sizing and focus after overlay opens
 * (autoFocus is unreliable while the Dropdown is still mounting).
 */
const ManualEntryFilterSearch: FC<ManualEntryFilterSearchProps> = ({
  visible,
  value,
  placeholder,
  onValueChange,
}) => {
  const inputRef = useRef<InputRef>(null);

  useLayoutEffect(() => {
    if (!visible) return;

    const focusInput = () => {
      const inst = inputRef.current;
      if (!inst) return;
      const el = inst.input;
      (el ?? inst).focus({ preventScroll: true });
      if (el && typeof el.setSelectionRange === 'function') {
        const len = el.value?.length ?? 0;
        el.setSelectionRange(len, len);
      }
    };

    focusInput();
    const t1 = window.setTimeout(focusInput, 0);
    const t2 = window.setTimeout(focusInput, 100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [visible]);

  const stopFilterKeyPropagation = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
  }, []);

  return (
    <div className="p-2">
      <Input
        ref={inputRef}
        allowClear
        variant="outlined"
        placeholder={placeholder}
        prefix={<SearchOutlined className="text-[rgba(0,0,0,0.45)]" />}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onValueChange(e.target.value)}
        onKeyDown={stopFilterKeyPropagation}
      />
    </div>
  );
};

const ManualDataEntryModal: FC<Props> = ({
  open,
  onClose,
  onSave,
  mapRegionIds,
  historicalDataImport,
}) => {
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
  const [isTimelineMode, setIsTimelineMode] = useState(() =>
    isTimelineManualEntryMode(timelineData, timePeriods, historicalDataImport),
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({ ...EMPTY_FILTERS });
  const [sortedInfo, setSortedInfo] = useState<{
    field?: string;
    order?: 'ascend' | 'descend';
  }>({});

  const filterId = columnFilters.id;
  const filterLabel = columnFilters.label;
  const filterValue = columnFilters.value;
  const filterTime = columnFilters.time;

  const updateColumnFilter = useCallback((columnKey: ColumnFilterKey, value: string) => {
    startTransition(() => {
      setColumnFilters((f) => ({ ...f, [columnKey]: value }));
    });
  }, []);

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

  const handleAfterOpenChange: ModalProps['afterOpenChange'] = useCallback(
    (visible: boolean) => {
      if (visible) {
        const timeline = isTimelineManualEntryMode(timelineData, timePeriods, historicalDataImport);
        setIsTimelineMode(timeline);
        setColumnFilters({ ...EMPTY_FILTERS });
        setSortedInfo({});
        setSelectedRowKeys([]);
        setRows(buildInitialRows(storeData, timelineData, timePeriods, historicalDataImport));
      }
    },
    [storeData, timelineData, timePeriods, historicalDataImport],
  );

  const handleAddMissingRow = useCallback(() => {
    setRows((prev) => {
      const slot = findFirstMissingDataSlot(prev, mapRegionIds, isTimelineMode, timePeriods);
      if (!slot) return prev;
      const existing = prev.find((r) => r.id === slot.id);
      const labelReuse =
        existing?.label != null && existing.label.trim() !== '' ? existing.label : slot.id;
      const base: DataRow = {
        key: generateRandomId(),
        id: slot.id,
        label: labelReuse,
        value: 0,
      };
      const nextRow: DataRow =
        slot.kind === 'timeline' ? { ...base, timePeriod: slot.timePeriod } : base;
      return [...prev, nextRow];
    });
  }, [mapRegionIds, isTimelineMode, timePeriods]);

  const handleToggleChartVisibility = useCallback((rowKey: string) => {
    setRows((prev) =>
      prev.map((r) => (r.key === rowKey ? { ...r, hidden: r.hidden !== true } : r)),
    );
  }, []);

  const handleLabelChange: InputProps['onChange'] = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const key = e.currentTarget.dataset.rowkey;
      if (!key) return;
      const nextLabel = e.target.value;
      setRows((prev) => prev.map((r) => (r.key === key ? { ...r, label: nextLabel } : r)));
    },
    [],
  );

  const handleValueChange = useCallback((rowKey: string, value: number | null) => {
    setRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, value: value ?? 0 } : r)));
  }, []);

  const handleDeleteRow = useCallback(
    (rowKey: string) => {
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
      setSelectedRowKeys((keys) => keys.filter((k) => k !== rowKey));
    },
    [isTimelineMode, timePeriods],
  );

  const handleClearAll = useCallback(() => {
    const defaultTime = timePeriods.length > 0 ? timePeriods[0] : undefined;
    setRows([
      {
        ...createEmptyStaticRow(),
        ...(isTimelineMode ? { timePeriod: defaultTime ?? '' } : {}),
      },
    ]);
    setSelectedRowKeys([]);
  }, [timePeriods, isTimelineMode]);

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
      setRows((prev) => mergeVisibleRowReorder(prev, nextVisible));
    },
    [tableData],
  );

  const { sensors, onDragEnd, rowSortableItems } = useManualEntryTableDnd({
    rowKeysInOrder: tableData.map((r) => r.key),
    onRowReorder,
  });

  const BodyWrapper = useMemo(
    () => createSortableTbodyWrapper(rowSortableItems),
    [rowSortableItems],
  );

  const manualEntryFilterDropdownProps = useMemo(
    () => ({
      autoFocus: true,
      getPopupContainer: (triggerNode: HTMLElement): HTMLElement => {
        const root = triggerNode.closest('.ant-modal-content');
        return root instanceof HTMLElement ? root : document.body;
      },
    }),
    [],
  );

  const tableComponents = useMemo(
    () => ({
      body: { wrapper: BodyWrapper, row: SortableBodyRow },
    }),
    [BodyWrapper],
  );

  const bulkRemoveSelected = useCallback(() => {
    const sel = new Set(selectedRowKeys.map(String));
    if (sel.size === 0) return;
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
    setSelectedRowKeys([]);
  }, [selectedRowKeys, isTimelineMode, timePeriods]);

  const bulkHideSelected = useCallback(() => {
    const sel = new Set(selectedRowKeys.map(String));
    if (sel.size === 0) return;
    setRows((prev) => prev.map((r) => (sel.has(r.key) ? { ...r, hidden: true } : r)));
  }, [selectedRowKeys]);

  const bulkShowSelected = useCallback(() => {
    const sel = new Set(selectedRowKeys.map(String));
    if (sel.size === 0) return;
    setRows((prev) => prev.map((r) => (sel.has(r.key) ? { ...r, hidden: false } : r)));
  }, [selectedRowKeys]);

  const idFilterDropdown = useMemo(
    () =>
      function IdFilterDropdown({ visible }: FilterDropdownProps) {
        return (
          <ManualEntryFilterSearch
            visible={visible}
            value={filterId}
            placeholder={t('visualizer.manualEntry.filterPlaceholder.id')}
            onValueChange={(v) => updateColumnFilter('id', v)}
          />
        );
      },
    [filterId, t, updateColumnFilter],
  );

  const labelFilterDropdown = useMemo(
    () =>
      function LabelFilterDropdown({ visible }: FilterDropdownProps) {
        return (
          <ManualEntryFilterSearch
            visible={visible}
            value={filterLabel}
            placeholder={t('visualizer.manualEntry.filterPlaceholder.label')}
            onValueChange={(v) => updateColumnFilter('label', v)}
          />
        );
      },
    [filterLabel, t, updateColumnFilter],
  );

  const valueFilterDropdown = useMemo(
    () =>
      function ValueFilterDropdown({ visible }: FilterDropdownProps) {
        return (
          <ManualEntryFilterSearch
            visible={visible}
            value={filterValue}
            placeholder={t('visualizer.manualEntry.filterPlaceholder.value')}
            onValueChange={(v) => updateColumnFilter('value', v)}
          />
        );
      },
    [filterValue, t, updateColumnFilter],
  );

  const timeFilterDropdown = useMemo(
    () =>
      function TimeFilterDropdown({ visible }: FilterDropdownProps) {
        return (
          <ManualEntryFilterSearch
            visible={visible}
            value={filterTime}
            placeholder={t('visualizer.manualEntry.filterPlaceholder.time')}
            onValueChange={(v) => updateColumnFilter('time', v)}
          />
        );
      },
    [filterTime, t, updateColumnFilter],
  );

  const rowSelection = useMemo<TableProps<DataRow>['rowSelection']>(
    () => ({
      selectedRowKeys,
      onChange: (keys) => setSelectedRowKeys(keys),
      columnWidth: 48,
      selections: [
        Table.SELECTION_ALL,
        Table.SELECTION_INVERT,
        Table.SELECTION_NONE,
        {
          key: 'bulk-remove',
          text: t('visualizer.manualEntry.bulkRemoveSelected'),
          onSelect: () => bulkRemoveSelected(),
        },
        {
          key: 'bulk-hide',
          text: t('visualizer.manualEntry.bulkHideSelected'),
          onSelect: () => bulkHideSelected(),
        },
        {
          key: 'bulk-show',
          text: t('visualizer.manualEntry.bulkShowSelected'),
          onSelect: () => bulkShowSelected(),
        },
      ],
    }),
    [selectedRowKeys, t, bulkRemoveSelected, bulkHideSelected, bulkShowSelected],
  );

  const indexCol = useMemo(
    (): TableColumnType<DataRow> => ({
      key: 'index',
      title: (
        <Typography.Text className="text-sm">
          {t('visualizer.manualEntry.colIndex')}
        </Typography.Text>
      ),
      width: 56,
      fixed: 'left',
      align: 'center',
      render: (_, __, index) => (
        <div className="flex items-center justify-center gap-1">
          <HolderOutlined className="shrink-0 text-xs text-gray-400" aria-hidden />
          <Typography.Text className="text-center text-sm text-gray-500">
            {index + 1}
          </Typography.Text>
        </div>
      ),
    }),
    [t],
  );

  const idCol = useMemo(
    (): TableColumnType<DataRow> => ({
      key: 'id',
      title: (
        <Typography.Text className="text-sm">{t('visualizer.manualEntry.colId')}</Typography.Text>
      ),
      filtered: Boolean(filterId.trim()),
      filterDropdown: idFilterDropdown,
      filterDropdownProps: manualEntryFilterDropdownProps,
      filterIcon: (filtered: boolean) => (
        <SearchOutlined className={filtered ? 'text-primary' : 'text-gray-400'} />
      ),
      sorter: (a: DataRow, b: DataRow) =>
        a.id.trim().localeCompare(b.id.trim(), undefined, { numeric: true }),
      sortOrder: sortedInfo.field === 'id' ? sortedInfo.order : null,
      width: 120,
      render: (_, record) => (
        <Input
          value={record.id}
          data-rowkey={record.key}
          disabled
          placeholder={placeholderRegionId}
        />
      ),
    }),
    [
      idFilterDropdown,
      manualEntryFilterDropdownProps,
      filterId,
      sortedInfo.field,
      sortedInfo.order,
      t,
      placeholderRegionId,
    ],
  );

  const labelCol = useMemo(
    (): TableColumnType<DataRow> => ({
      key: 'label',
      title: (
        <Typography.Text className="text-sm">
          {t('visualizer.manualEntry.colLabel')}
        </Typography.Text>
      ),
      filtered: Boolean(filterLabel.trim()),
      filterDropdown: labelFilterDropdown,
      filterDropdownProps: manualEntryFilterDropdownProps,
      filterIcon: (filtered: boolean) => (
        <SearchOutlined className={filtered ? 'text-primary' : 'text-gray-400'} />
      ),
      sorter: (a: DataRow, b: DataRow) =>
        a.label.trim().localeCompare(b.label.trim(), undefined, { numeric: true }),
      sortOrder: sortedInfo.field === 'label' ? sortedInfo.order : null,
      shouldCellUpdate: (record, prev) => record.key === prev.key && record.label === prev.label,
      render: (_, record) => (
        <Input
          value={record.label}
          data-rowkey={record.key}
          onChange={handleLabelChange}
          placeholder={placeholderLabel}
        />
      ),
    }),
    [
      labelFilterDropdown,
      manualEntryFilterDropdownProps,
      filterLabel,
      sortedInfo.field,
      sortedInfo.order,
      t,
      placeholderLabel,
      handleLabelChange,
    ],
  );

  const valueCol = useMemo(
    (): TableColumnType<DataRow> => ({
      key: 'value',
      title: (
        <Typography.Text className="text-sm">
          {t('visualizer.manualEntry.colValue')}
        </Typography.Text>
      ),
      filtered: Boolean(filterValue.trim()),
      filterDropdown: valueFilterDropdown,
      filterDropdownProps: manualEntryFilterDropdownProps,
      filterIcon: (filtered: boolean) => (
        <SearchOutlined className={filtered ? 'text-primary' : 'text-gray-400'} />
      ),
      sorter: (a: DataRow, b: DataRow) => a.value - b.value,
      sortOrder: sortedInfo.field === 'value' ? sortedInfo.order : null,
      width: 120,
      shouldCellUpdate: (record, prev) => record.key === prev.key && record.value === prev.value,
      render: (_, record) => (
        <InputNumber
          value={record.value}
          onChange={(v: number | null) => handleValueChange(record.key, v)}
          min={0}
          className="w-full max-w-full"
        />
      ),
    }),
    [
      valueFilterDropdown,
      manualEntryFilterDropdownProps,
      filterValue,
      sortedInfo.field,
      sortedInfo.order,
      t,
      handleValueChange,
    ],
  );

  const timeCol = useMemo(
    (): TableColumnType<DataRow> => ({
      key: 'time',
      title: (
        <Typography.Text className="text-sm">{t('visualizer.manualEntry.colTime')}</Typography.Text>
      ),
      filtered: Boolean(filterTime.trim()),
      filterDropdown: timeFilterDropdown,
      filterDropdownProps: manualEntryFilterDropdownProps,
      filterIcon: (filtered: boolean) => (
        <SearchOutlined className={filtered ? 'text-primary' : 'text-gray-400'} />
      ),
      sorter: (a: DataRow, b: DataRow) => compareTimePeriodForSort(a.timePeriod, b.timePeriod),
      sortOrder: sortedInfo.field === 'time' ? sortedInfo.order : null,
      width: 100,
      render: (_, record) => {
        const timeValue =
          record.timePeriod != null &&
          record.timePeriod !== '' &&
          !Number.isNaN(Number(record.timePeriod))
            ? Number(record.timePeriod)
            : null;
        return <InputNumber value={timeValue} disabled controls={false} className="w-full" />;
      },
    }),
    [
      timeFilterDropdown,
      manualEntryFilterDropdownProps,
      filterTime,
      sortedInfo.field,
      sortedInfo.order,
      t,
    ],
  );

  const actionsCol = useMemo(
    (): TableColumnType<DataRow> => ({
      key: 'actions',
      fixed: 'right',
      width: 72,
      title: '\u00a0',
      render: (_, record) => {
        const hidden = record.hidden === true;
        return (
          <Flex gap={0}>
            <Tooltip
              title={
                hidden
                  ? t('visualizer.manualEntry.showOnChart')
                  : t('visualizer.manualEntry.hideFromChart')
              }
            >
              <Button
                type="text"
                size="small"
                icon={hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => handleToggleChartVisibility(record.key)}
                aria-label={
                  hidden
                    ? t('visualizer.manualEntry.showOnChart')
                    : t('visualizer.manualEntry.hideFromChart')
                }
                className={hidden ? 'text-gray-400' : 'text-gray-600'}
              />
            </Tooltip>
            <Tooltip title={t('visualizer.manualEntry.deleteRow')}>
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteRow(record.key)}
                aria-label={t('visualizer.manualEntry.deleteRow')}
              />
            </Tooltip>
          </Flex>
        );
      },
    }),
    [t, handleToggleChartVisibility, handleDeleteRow],
  );

  const tableColumns = useMemo((): TableColumnType<DataRow>[] => {
    const middle = isTimelineMode
      ? [idCol, labelCol, valueCol, timeCol]
      : [idCol, labelCol, valueCol];
    return [indexCol, ...middle, actionsCol];
  }, [indexCol, idCol, labelCol, valueCol, timeCol, isTimelineMode, actionsCol]);

  const rowClassName: TableProps<DataRow>['rowClassName'] = useCallback(
    (record: DataRow) => {
      const matched = isManualEntryRowMatchedToExpected(
        record,
        mapRegionIds,
        isTimelineMode,
        timePeriods,
      );
      return matched ? 'border-l-[3px] border-l-primary' : '';
    },
    [mapRegionIds, isTimelineMode, timePeriods],
  );

  const onTableChange: TableProps<DataRow>['onChange'] = useCallback(
    (
      _pagination: TablePaginationConfig,
      _filters: Record<string, FilterValue | null>,
      sorter: SorterResult<DataRow> | SorterResult<DataRow>[],
      extra: TableCurrentDataSource<DataRow>,
    ) => {
      if (extra.action !== 'sort') return;

      const s = Array.isArray(sorter) ? sorter[0] : sorter;
      let field: string | undefined;
      if (s && 'field' in s && s.field != null) {
        field = String(s.field);
      } else if (s?.columnKey != null) {
        field = String(s.columnKey);
      }
      if (!field || !s?.order) {
        setSortedInfo({});
        return;
      }
      setSortedInfo({
        field,
        order: s.order,
      });
    },
    [],
  );

  return (
    <Modal
      title={t('visualizer.manualEntry.title')}
      open={open}
      onCancel={handleCancel}
      maskClosable={false}
      afterOpenChange={handleAfterOpenChange}
      footer={
        <Flex justify="flex-end" gap="small">
          <Button onClick={handleCancel}>{t('nav.cancel')}</Button>
          <Button type="primary" onClick={handleApplyData}>
            {t('visualizer.save')}
          </Button>
        </Flex>
      }
      centered
      className="w-4/5! lg:w-2/3! [&_.ant-table-body]:[scrollbar-width:thin] [&_.ant-table-body::-webkit-scrollbar]:h-1.5 [&_.ant-table-body::-webkit-scrollbar]:w-1.5 [&_.ant-table-thead>tr>th]:text-sm"
      destroyOnHidden
      focusable={{ trap: false }}
    >
      <Flex vertical gap="small" className="py-md">
        <Flex gap="small" justify="flex-end" wrap="wrap">
          <Flex gap={4}>
            <Tooltip title={t('visualizer.manualEntry.clearAll')}>
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                danger
                onClick={handleClearAll}
              />
            </Tooltip>
            {canAddMissing ? (
              <Tooltip title={t('visualizer.manualEntry.addMissingRow')}>
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={handleAddMissingRow}
                  className="text-gray-500"
                  aria-label={t('visualizer.manualEntry.addMissingRow')}
                />
              </Tooltip>
            ) : null}
          </Flex>
        </Flex>

        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <Table<DataRow>
            size="small"
            rowKey="key"
            columns={tableColumns}
            dataSource={tableData}
            rowSelection={rowSelection}
            pagination={false}
            scroll={{ x: 720, y: '65vh' }}
            sortDirections={['ascend', 'descend']}
            showSorterTooltip={{ target: 'sorter-icon' }}
            onChange={onTableChange}
            rowClassName={rowClassName}
            components={tableComponents}
            className="[&_.ant-table-cell]:align-middle"
            locale={{
              filterReset: t('visualizer.manualEntry.filterReset'),
            }}
          />
        </DndContext>

        {canAddMissing ? (
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddMissingRow}
            className="w-fit self-start"
            aria-label={t('visualizer.manualEntry.addMissingRow')}
          >
            {t('visualizer.manualEntry.addMissingRow')}
          </Button>
        ) : null}
      </Flex>
    </Modal>
  );
};

export default ManualDataEntryModal;
