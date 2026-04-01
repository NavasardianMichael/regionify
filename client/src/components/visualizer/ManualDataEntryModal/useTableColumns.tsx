import { type ReactNode, useMemo } from 'react';
import { SearchOutlined } from '@ant-design/icons';
import type { TableColumnType } from 'antd';
import { Input, InputNumber, Typography } from 'antd';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import { compareTimePeriodForSort, type DataRow } from '@/helpers/manualDataEntryHelpers';
import { ActionsCell } from './ActionsCell';
import { LabelCell } from './LabelCell';
import { TextFilterBody } from './TextFilterBody';
import type { MiddleColKey } from './types';
import type { ModalState } from './useModalState';
import { ValueCell } from './ValueCell';

function columnTitleText(text: string): ReactNode {
  return <Typography.Text className="block min-w-0 truncate font-semibold">{text}</Typography.Text>;
}

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

  const idFilterDropdown = useMemo((): TableColumnType<DataRow>['filterDropdown'] => {
    function IdFilterDropdown(props: FilterDropdownProps) {
      return (
        <TextFilterBody
          columnKey="id"
          visible={props.visible}
          setColumnFilters={setColumnFilters}
          placeholder={t('visualizer.manualEntry.filterPlaceholder.id')}
          filtersRef={columnFiltersRef}
        />
      );
    }
    return IdFilterDropdown;
  }, [t, setColumnFilters, columnFiltersRef]);

  const labelFilterDropdown = useMemo((): TableColumnType<DataRow>['filterDropdown'] => {
    function LabelFilterDropdown(props: FilterDropdownProps) {
      return (
        <TextFilterBody
          columnKey="label"
          visible={props.visible}
          setColumnFilters={setColumnFilters}
          placeholder={t('visualizer.manualEntry.filterPlaceholder.label')}
          filtersRef={columnFiltersRef}
        />
      );
    }
    return LabelFilterDropdown;
  }, [t, setColumnFilters, columnFiltersRef]);

  const valueFilterDropdown = useMemo((): TableColumnType<DataRow>['filterDropdown'] => {
    function ValueFilterDropdown(props: FilterDropdownProps) {
      return (
        <TextFilterBody
          columnKey="value"
          visible={props.visible}
          setColumnFilters={setColumnFilters}
          placeholder={t('visualizer.manualEntry.filterPlaceholder.value')}
          filtersRef={columnFiltersRef}
        />
      );
    }
    return ValueFilterDropdown;
  }, [t, setColumnFilters, columnFiltersRef]);

  const timeFilterDropdown = useMemo((): TableColumnType<DataRow>['filterDropdown'] => {
    function TimeFilterDropdown(props: FilterDropdownProps) {
      return (
        <TextFilterBody
          columnKey="time"
          visible={props.visible}
          setColumnFilters={setColumnFilters}
          placeholder={t('visualizer.manualEntry.filterPlaceholder.time')}
          filtersRef={columnFiltersRef}
        />
      );
    }
    return TimeFilterDropdown;
  }, [t, setColumnFilters, columnFiltersRef]);

  return useMemo((): TableColumnType<DataRow>[] => {
    const ro = googleSheetsSyncReadOnly;

    type FilterDropdownFn = NonNullable<TableColumnType<DataRow>['filterDropdown']>;
    const filterDropdownByKey: Record<MiddleColKey, FilterDropdownFn> = {
      id: idFilterDropdown as FilterDropdownFn,
      label: labelFilterDropdown as FilterDropdownFn,
      value: valueFilterDropdown as FilterDropdownFn,
      time: timeFilterDropdown as FilterDropdownFn,
    };

    const filterFor = (key: MiddleColKey) => ({
      filtered: Boolean(columnFilters[key].trim()),
      filterDropdown: filterDropdownByKey[key],
      filterDropdownProps,
      filterIcon: (filtered: boolean) => (
        <SearchOutlined className={filtered ? 'text-primary' : 'text-gray-400'} />
      ),
    });

    const middleBuilders: Record<MiddleColKey, () => TableColumnType<DataRow>> = {
      id: () => ({
        key: 'id',
        title: columnTitleText(t('visualizer.manualEntry.colId')),
        sorter: (a: DataRow, b: DataRow) =>
          a.id.trim().localeCompare(b.id.trim(), undefined, { numeric: true }),
        sortOrder: sortedInfo.field === 'id' ? sortedInfo.order : null,
        ...filterFor('id'),
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
        title: columnTitleText(t('visualizer.manualEntry.colLabel')),
        sorter: (a: DataRow, b: DataRow) =>
          a.label.trim().localeCompare(b.label.trim(), undefined, { numeric: true }),
        sortOrder: sortedInfo.field === 'label' ? sortedInfo.order : null,
        ...filterFor('label'),
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
        title: columnTitleText(t('visualizer.manualEntry.colValue')),
        sorter: (a: DataRow, b: DataRow) => a.value - b.value,
        sortOrder: sortedInfo.field === 'value' ? sortedInfo.order : null,
        ...filterFor('value'),
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
        title: columnTitleText(t('visualizer.manualEntry.colTime')),
        sorter: (a: DataRow, b: DataRow) => compareTimePeriodForSort(a.timePeriod, b.timePeriod),
        sortOrder: sortedInfo.field === 'time' ? sortedInfo.order : null,
        ...filterFor('time'),
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
        <div className="text-center font-semibold whitespace-nowrap">
          {t('visualizer.manualEntry.colIndex')}
        </div>
      ),
      align: 'center',
      className: '!w-0 max-w-min whitespace-nowrap !px-1',
      onHeaderCell: () => ({ className: '!w-0 max-w-min whitespace-nowrap !px-1' }),
      render: (_, __, index) => (
        <Typography.Text className="block text-center whitespace-nowrap text-gray-500">
          {index + 1}
        </Typography.Text>
      ),
    };

    const actionsCol: TableColumnType<DataRow> = {
      key: 'actions',
      align: 'right',
      className: '!w-0 max-w-min whitespace-nowrap !px-1',
      onHeaderCell: () => ({ className: '!w-0 max-w-min whitespace-nowrap !px-1 text-right' }),
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
    idFilterDropdown,
    labelFilterDropdown,
    valueFilterDropdown,
    timeFilterDropdown,
    filterDropdownProps,
    t,
    placeholderRegionId,
    placeholderLabel,
    patchLabel,
    handleValueChange,
    onActionsClick,
  ]);
}
