import { type FC, useCallback, useMemo, useState } from 'react';
import {
  DeleteOutlined,
  DownOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  MenuOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { DndContext } from '@dnd-kit/core';
import type { MenuProps, TableColumnType, TablePaginationConfig, TableProps } from 'antd';
import {
  Button,
  Checkbox,
  Dropdown,
  Flex,
  Input,
  InputNumber,
  type InputProps,
  Modal,
  type ModalProps,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import type { FilterDropdownProps, FilterValue, SorterResult } from 'antd/es/table/interface';
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
  createSortableTheadWrapper,
  SortableBodyRow,
  SortableColumnTitle,
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

type MiddleColKey = Exclude<ColumnFilterKey, never>;

function sortTableData(
  data: DataRow[],
  field: string | undefined,
  order: 'ascend' | 'descend' | null | undefined,
  preSortIndex: Map<string, number>,
): DataRow[] {
  if (!field || !order) return data;
  const dir = order === 'ascend' ? 1 : -1;
  const mult = dir;
  return [...data].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'index':
        cmp = (preSortIndex.get(a.key) ?? 0) - (preSortIndex.get(b.key) ?? 0);
        break;
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
  const [middleColOrder, setMiddleColOrder] = useState<MiddleColKey[]>(() =>
    isTimelineManualEntryMode(timelineData, timePeriods, historicalDataImport)
      ? ['id', 'label', 'value', 'time']
      : ['id', 'label', 'value'],
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

  const preSortIndex = useMemo(() => {
    const m = new Map<string, number>();
    filteredRows.forEach((r, i) => m.set(r.key, i));
    return m;
  }, [filteredRows]);

  const tableData = useMemo(
    () => sortTableData(filteredRows, sortedInfo.field, sortedInfo.order, preSortIndex),
    [filteredRows, sortedInfo, preSortIndex],
  );

  const visibleRowKeys = useMemo(() => tableData.map((r) => r.key), [tableData]);
  const selectedVisibleCount = useMemo(
    () => selectedRowKeys.filter((k) => visibleRowKeys.includes(String(k))).length,
    [selectedRowKeys, visibleRowKeys],
  );

  const handleAfterOpenChange: ModalProps['afterOpenChange'] = useCallback(
    (visible: boolean) => {
      if (visible) {
        const timeline = isTimelineManualEntryMode(timelineData, timePeriods, historicalDataImport);
        setIsTimelineMode(timeline);
        setMiddleColOrder(timeline ? ['id', 'label', 'value', 'time'] : ['id', 'label', 'value']);
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

  const onColumnReorder = useCallback((next: string[]) => {
    setMiddleColOrder(next as MiddleColKey[]);
  }, []);

  const { sensors, onDragEnd, rowSortableItems, colSortableItems } = useManualEntryTableDnd({
    rowKeysInOrder: tableData.map((r) => r.key),
    middleColumnKeys: middleColOrder,
    onRowReorder,
    onColumnReorder,
  });

  const HeaderWrapper = useMemo(
    () => createSortableTheadWrapper(colSortableItems),
    [colSortableItems],
  );
  const BodyWrapper = useMemo(
    () => createSortableTbodyWrapper(rowSortableItems),
    [rowSortableItems],
  );

  const tableComponents = useMemo(
    () => ({
      header: { wrapper: HeaderWrapper },
      body: { wrapper: BodyWrapper, row: SortableBodyRow },
    }),
    [HeaderWrapper, BodyWrapper],
  );

  const makeTextFilterDropdown = useCallback(
    (columnKey: ColumnFilterKey): TableColumnType<DataRow>['filterDropdown'] => {
      function ManualFilterDropdown({ close }: FilterDropdownProps) {
        return (
          <Flex
            vertical
            className="w-52 p-2"
            role="search"
            tabIndex={-1}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Input
              allowClear
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder={t(`visualizer.manualEntry.filterPlaceholder.${columnKey}`)}
              value={columnFilters[columnKey]}
              onChange={(e) => setColumnFilters((f) => ({ ...f, [columnKey]: e.target.value }))}
            />
            <Flex justify="flex-end" className="mt-2">
              <Button type="link" size="small" onClick={() => close()}>
                {t('visualizer.manualEntry.filterClose')}
              </Button>
            </Flex>
          </Flex>
        );
      }
      return ManualFilterDropdown;
    },
    [columnFilters, t],
  );

  const tableColumns = useMemo((): TableColumnType<DataRow>[] => {
    const middleBuilders: Record<MiddleColKey, () => TableColumnType<DataRow>> = {
      id: () => ({
        key: 'id',
        title: <SortableColumnTitle id="id" title={t('visualizer.manualEntry.colId')} />,
        sorter: (a: DataRow, b: DataRow) =>
          a.id.trim().localeCompare(b.id.trim(), undefined, { numeric: true }),
        sortOrder: sortedInfo.field === 'id' ? sortedInfo.order : null,
        filtered: Boolean(columnFilters.id),
        filterDropdown: makeTextFilterDropdown('id'),
        filterIcon: (filtered) => (
          <SearchOutlined className={filtered ? 'text-primary' : 'text-gray-400'} />
        ),
        width: 120,
        render: (_, record) => (
          <Input
            value={record.id}
            data-rowkey={record.key}
            disabled
            placeholder={placeholderRegionId}
            className="bg-gray-50"
          />
        ),
      }),
      label: () => ({
        key: 'label',
        title: <SortableColumnTitle id="label" title={t('visualizer.manualEntry.colLabel')} />,
        sorter: (a: DataRow, b: DataRow) =>
          a.label.trim().localeCompare(b.label.trim(), undefined, { numeric: true }),
        sortOrder: sortedInfo.field === 'label' ? sortedInfo.order : null,
        filtered: Boolean(columnFilters.label),
        filterDropdown: makeTextFilterDropdown('label'),
        filterIcon: (filtered) => (
          <SearchOutlined className={filtered ? 'text-primary' : 'text-gray-400'} />
        ),
        render: (_, record) => (
          <Input
            value={record.label}
            data-rowkey={record.key}
            onChange={handleLabelChange}
            placeholder={placeholderLabel}
          />
        ),
      }),
      value: () => ({
        key: 'value',
        title: <SortableColumnTitle id="value" title={t('visualizer.manualEntry.colValue')} />,
        sorter: (a: DataRow, b: DataRow) => a.value - b.value,
        sortOrder: sortedInfo.field === 'value' ? sortedInfo.order : null,
        filtered: Boolean(columnFilters.value),
        filterDropdown: makeTextFilterDropdown('value'),
        filterIcon: (filtered) => (
          <SearchOutlined className={filtered ? 'text-primary' : 'text-gray-400'} />
        ),
        width: 120,
        render: (_, record) => (
          <InputNumber
            value={record.value}
            onChange={(v) => handleValueChange(record.key, v)}
            min={0}
            className="w-full max-w-full"
          />
        ),
      }),
      time: () => ({
        key: 'time',
        title: <SortableColumnTitle id="time" title={t('visualizer.manualEntry.colTime')} />,
        sorter: (a: DataRow, b: DataRow) => compareTimePeriodForSort(a.timePeriod, b.timePeriod),
        sortOrder: sortedInfo.field === 'time' ? sortedInfo.order : null,
        filtered: Boolean(columnFilters.time),
        filterDropdown: makeTextFilterDropdown('time'),
        filterIcon: (filtered) => (
          <SearchOutlined className={filtered ? 'text-primary' : 'text-gray-400'} />
        ),
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
    };

    const middle = middleColOrder
      .filter((k) => k !== 'time' || isTimelineMode)
      .map((k) => middleBuilders[k]());

    const selectCol: TableColumnType<DataRow> = {
      key: 'select',
      fixed: 'left',
      width: 48,
      title: (
        <Checkbox
          checked={visibleRowKeys.length > 0 && selectedVisibleCount === visibleRowKeys.length}
          indeterminate={selectedVisibleCount > 0 && selectedVisibleCount < visibleRowKeys.length}
          aria-label={t('visualizer.manualEntry.selectAll')}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRowKeys((prev) => {
                const set = new Set(prev.map(String));
                visibleRowKeys.forEach((k) => set.add(k));
                return [...set];
              });
            } else {
              setSelectedRowKeys((prev) => prev.filter((k) => !visibleRowKeys.includes(String(k))));
            }
          }}
        />
      ),
      render: (_, record) => (
        <Checkbox
          checked={selectedRowKeys.includes(record.key)}
          onChange={(e) => {
            const checked = e.target.checked;
            setSelectedRowKeys((keys) =>
              checked ? [...keys, record.key] : keys.filter((k) => k !== record.key),
            );
          }}
        />
      ),
    };

    const dragCol: TableColumnType<DataRow> = {
      key: 'drag',
      fixed: 'left',
      width: 40,
      title: ' ',
      className: 'text-center',
      render: () => <MenuOutlined className="cursor-grab text-xs text-gray-400" aria-hidden />,
    };

    const indexCol: TableColumnType<DataRow> = {
      key: 'index',
      title: t('visualizer.manualEntry.colIndex'),
      width: 56,
      fixed: 'left',
      sorter: (a: DataRow, b: DataRow) =>
        (preSortIndex.get(a.key) ?? 0) - (preSortIndex.get(b.key) ?? 0),
      sortOrder: sortedInfo.field === 'index' ? sortedInfo.order : null,
      render: (_, __, index) => (
        <Typography.Text className="text-center text-sm text-gray-500">{index + 1}</Typography.Text>
      ),
    };

    const actionsCol: TableColumnType<DataRow> = {
      key: 'actions',
      fixed: 'right',
      width: 88,
      title: t('visualizer.manualEntry.colActions'),
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
    };

    return [selectCol, dragCol, indexCol, ...middle, actionsCol];
  }, [
    middleColOrder,
    isTimelineMode,
    sortedInfo,
    columnFilters,
    makeTextFilterDropdown,
    t,
    placeholderRegionId,
    placeholderLabel,
    handleLabelChange,
    handleValueChange,
    handleToggleChartVisibility,
    handleDeleteRow,
    selectedRowKeys,
    preSortIndex,
    visibleRowKeys,
    selectedVisibleCount,
  ]);

  const rowClassName: TableProps<DataRow>['rowClassName'] = useCallback(
    (record: DataRow) => {
      const matched = isManualEntryRowMatchedToExpected(
        record,
        mapRegionIds,
        isTimelineMode,
        timePeriods,
      );
      return matched ? 'bg-[rgba(24,41,77,0.08)] border-l-[3px] border-l-primary' : '';
    },
    [mapRegionIds, isTimelineMode, timePeriods],
  );

  const onTableChange: TableProps<DataRow>['onChange'] = useCallback(
    (
      _pagination: TablePaginationConfig,
      _filters: Record<string, FilterValue | null>,
      sorter: SorterResult<DataRow> | SorterResult<DataRow>[],
    ) => {
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

  const bulkRemoveSelected = useCallback(() => {
    if (selectedRowKeys.length === 0) return;
    const sel = new Set(selectedRowKeys.map(String));
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
    if (selectedRowKeys.length === 0) return;
    const sel = new Set(selectedRowKeys.map(String));
    setRows((prev) => prev.map((r) => (sel.has(r.key) ? { ...r, hidden: true } : r)));
  }, [selectedRowKeys]);

  const bulkShowSelected = useCallback(() => {
    if (selectedRowKeys.length === 0) return;
    const sel = new Set(selectedRowKeys.map(String));
    setRows((prev) => prev.map((r) => (sel.has(r.key) ? { ...r, hidden: false } : r)));
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
    (info) => {
      const { key } = info;
      if (selectedRowKeys.length === 0) return;
      if (key === 'remove') bulkRemoveSelected();
      else if (key === 'hide') bulkHideSelected();
      else if (key === 'show') bulkShowSelected();
    },
    [selectedRowKeys.length, bulkRemoveSelected, bulkHideSelected, bulkShowSelected],
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
      className="w-4/5! lg:w-2/3! [&_.ant-table-thead>tr>th]:text-xs"
      destroyOnHidden
    >
      <Flex vertical gap="small" className="py-md">
        <Flex gap="small" justify="space-between" wrap="wrap">
          <Dropdown menu={{ items: bulkMenuItems, onClick: onBulkMenuClick }} trigger={['click']}>
            <Button icon={<DownOutlined />} disabled={selectedRowKeys.length === 0}>
              {t('visualizer.manualEntry.bulkActions')}
            </Button>
          </Dropdown>
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
            pagination={false}
            scroll={{ x: 720, y: '65vh' }}
            sortDirections={['ascend', 'descend']}
            showSorterTooltip
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
