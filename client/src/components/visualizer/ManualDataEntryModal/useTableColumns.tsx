import { useMemo } from 'react';
import { SearchOutlined } from '@ant-design/icons';
import type { TableColumnType } from 'antd';
import { Input, InputNumber, Typography } from 'antd';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import { compareTimePeriodForSort, type DataRow } from '@/helpers/manualDataEntryHelpers';
import { ActionsCell } from './ActionsCell';
import { ColumnFilterDropdown } from './ColumnFilterDropdown';
import { LabelCell } from './LabelCell';
import type { MiddleColKey } from './types';
import type { ModalState } from './useModalState';
import { ValueCell } from './ValueCell';

const actionCellClass = '!w-0 max-w-min whitespace-nowrap !px-1';

export function useTableColumns(s: ModalState): TableColumnType<DataRow>[] {
  const {
    t,
    isTimelineMode,
    middleColOrder,
    googleSheetsSyncReadOnly,
    columnFilters,
    setColumnFilters,
    columnFiltersRef,
    sortedInfo,
    placeholderRegionId,
    placeholderLabel,
    patchLabel,
    handleValueChange,
    onActionsClick,
    filterDropdownProps,
  } = s;

  return useMemo((): TableColumnType<DataRow>[] => {
    const ro = googleSheetsSyncReadOnly;

    const filterFor = (
      key: MiddleColKey,
      placeholder: string,
    ): Partial<TableColumnType<DataRow>> => ({
      filtered: Boolean(columnFilters[key].trim()),
      filterDropdown: (props: FilterDropdownProps) => (
        <ColumnFilterDropdown
          {...props}
          columnKey={key}
          placeholder={placeholder}
          setColumnFilters={setColumnFilters}
          filtersRef={columnFiltersRef}
        />
      ),
      filterDropdownProps,
      filterIcon: (filtered: boolean) => (
        <SearchOutlined className={filtered ? 'text-primary' : 'text-gray-400'} />
      ),
    });

    const middleBuilders: Record<MiddleColKey, () => TableColumnType<DataRow>> = {
      id: () => ({
        key: 'id',
        title: (
          <Typography.Text
            className="block min-w-0 truncate font-semibold"
            data-i18n-key="visualizer.manualEntry.colId"
          >
            {t('visualizer.manualEntry.colId')}
          </Typography.Text>
        ),
        sorter: (a: DataRow, b: DataRow) =>
          a.id.trim().localeCompare(b.id.trim(), undefined, { numeric: true }),
        sortOrder: sortedInfo.field === 'id' ? sortedInfo.order : null,
        ...filterFor('id', t('visualizer.manualEntry.filterPlaceholder.id')),
        width: 120,
        render: (_, record) => (
          <Input
            value={record.id}
            data-rowkey={record.key}
            disabled
            placeholder={placeholderRegionId}
            className="w-full min-w-0 bg-gray-50"
          />
        ),
      }),
      label: () => ({
        key: 'label',
        title: (
          <Typography.Text
            className="block min-w-0 truncate font-semibold"
            data-i18n-key="visualizer.manualEntry.colLabel"
          >
            {t('visualizer.manualEntry.colLabel')}
          </Typography.Text>
        ),
        sorter: (a: DataRow, b: DataRow) =>
          a.label.trim().localeCompare(b.label.trim(), undefined, { numeric: true }),
        sortOrder: sortedInfo.field === 'label' ? sortedInfo.order : null,
        ...filterFor('label', t('visualizer.manualEntry.filterPlaceholder.label')),
        render: (_, record) => (
          <LabelCell
            key={`${record.key}\0${record.label}`}
            rowKey={record.key}
            label={record.label}
            placeholder={placeholderLabel}
            onCommit={patchLabel}
            readOnly={ro}
          />
        ),
      }),
      value: () => ({
        key: 'value',
        title: (
          <Typography.Text
            className="block min-w-0 truncate font-semibold"
            data-i18n-key="visualizer.manualEntry.colValue"
          >
            {t('visualizer.manualEntry.colValue')}
          </Typography.Text>
        ),
        sorter: (a: DataRow, b: DataRow) => a.value - b.value,
        sortOrder: sortedInfo.field === 'value' ? sortedInfo.order : null,
        ...filterFor('value', t('visualizer.manualEntry.filterPlaceholder.value')),
        width: 120,
        render: (_, record) => (
          <ValueCell
            rowKey={record.key}
            value={record.value}
            onCommit={handleValueChange}
            readOnly={ro}
          />
        ),
      }),
      time: () => ({
        key: 'time',
        title: (
          <Typography.Text
            className="block min-w-0 truncate font-semibold"
            data-i18n-key="visualizer.manualEntry.colTime"
          >
            {t('visualizer.manualEntry.colTime')}
          </Typography.Text>
        ),
        sorter: (a: DataRow, b: DataRow) => compareTimePeriodForSort(a.timePeriod, b.timePeriod),
        sortOrder: sortedInfo.field === 'time' ? sortedInfo.order : null,
        ...filterFor('time', t('visualizer.manualEntry.filterPlaceholder.time')),
        width: 100,
        render: (_, record) => {
          const timeValue =
            record.timePeriod != null &&
            record.timePeriod !== '' &&
            !Number.isNaN(Number(record.timePeriod))
              ? Number(record.timePeriod)
              : null;
          return (
            <InputNumber
              value={timeValue}
              disabled
              controls={false}
              className="w-full max-w-full min-w-0"
            />
          );
        },
      }),
    };

    const middle = middleColOrder
      .filter((k) => k !== 'time' || isTimelineMode)
      .map((k) => middleBuilders[k]());

    const indexCol: TableColumnType<DataRow> = {
      key: 'index',
      title: (
        <div
          className="text-center font-semibold whitespace-nowrap"
          data-i18n-key="visualizer.manualEntry.colIndex"
        >
          {t('visualizer.manualEntry.colIndex')}
        </div>
      ),
      align: 'center',
      className: actionCellClass,
      onHeaderCell: () => ({ className: actionCellClass }),
      render: (_, __, index) => (
        <Typography.Text className="block text-center whitespace-nowrap text-gray-500">
          {index + 1}
        </Typography.Text>
      ),
    };

    const actionsCol: TableColumnType<DataRow> = {
      key: 'actions',
      align: 'right',
      className: actionCellClass,
      onHeaderCell: () => ({ className: `${actionCellClass} text-right` }),
      title: '',
      render: (_, record) => (
        <ActionsCell
          rowKey={record.key}
          hidden={record.hidden === true}
          showOnChartLabel={t('visualizer.manualEntry.showOnChart')}
          hideFromChartLabel={t('visualizer.manualEntry.hideFromChart')}
          deleteRowLabel={t('visualizer.manualEntry.deleteRow')}
          onActionClick={onActionsClick}
          readOnly={ro}
        />
      ),
    };

    return [indexCol, ...middle, actionsCol];
  }, [
    middleColOrder,
    isTimelineMode,
    googleSheetsSyncReadOnly,
    sortedInfo,
    columnFilters,
    setColumnFilters,
    columnFiltersRef,
    filterDropdownProps,
    t,
    placeholderRegionId,
    placeholderLabel,
    patchLabel,
    handleValueChange,
    onActionsClick,
  ]);
}
