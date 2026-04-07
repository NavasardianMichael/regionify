import { type FC, useCallback, useMemo } from 'react';
import type { TablePaginationConfig, TableProps } from 'antd';
import { ConfigProvider, Modal as AntModal, Table } from 'antd';
import type { FilterValue, SorterResult, TableCurrentDataSource } from 'antd/es/table/interface';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import type { DataRow } from '@/helpers/manualDataEntryHelpers';
import bodyScrollbarStyles from '@/components/visualizer/modalBodyScrollbar.module.css';
import { Body } from './Body';
import { Footer } from './Footer';
import { SelectColumnHeader } from './SelectColumnHeader';
import { createSortableTbodyWrapper, SortableBodyRow, useTableDnd } from './tableDnD';
import { tableTheme } from './tableTheme';
import { useModalState } from './useModalState';
import { useTableColumns } from './useTableColumns';
import styles from './Modal.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
  mapRegionIds: string[];
  historicalDataImport: boolean;
  /** Live Google Sheet sync — table is view-only; edits happen in the sheet. */
  googleSheetsSyncReadOnly?: boolean;
};

export const ManualDataEntryModal: FC<Props> = ({
  open,
  onClose,
  onSave,
  mapRegionIds,
  historicalDataImport,
  googleSheetsSyncReadOnly = false,
}) => {
  const { t } = useTypedTranslation();

  const state = useModalState({
    mapRegionIds,
    historicalDataImport,
    googleSheetsSyncReadOnly,
    onSave,
    onClose,
  });

  const {
    googleSheetsSyncReadOnly: isGoogleSheetsReadOnly,
    tableData,
    setSortedInfo,
    handleAddMissingRow,
    handleApplyData,
    handleCancel,
    onRowReorder,
    canAddMissing,
    selectedRowKeys,
    setSelectedRowKeys,
    visibleRowKeys,
    selectedVisibleCount,
    bulkMenuItems,
    onBulkMenuClick,
  } = state;

  const tableColumns = useTableColumns(state);

  const { sensors, onDragEnd, rowSortableItems } = useTableDnd({
    rowKeysInOrder: tableData.map((r) => r.key),
    onRowReorder,
  });

  const BodyWrapper = useMemo(
    () => createSortableTbodyWrapper(rowSortableItems),
    [rowSortableItems],
  );

  const tableComponents = useMemo(
    () => ({
      body: { wrapper: BodyWrapper, row: SortableBodyRow },
    }),
    [BodyWrapper],
  );

  const rowSelection = useMemo<TableProps<DataRow>['rowSelection'] | undefined>(
    () =>
      isGoogleSheetsReadOnly
        ? undefined
        : {
            selectedRowKeys,
            preserveSelectedRowKeys: true,
            onChange: (keys) => {
              setSelectedRowKeys(keys);
            },
            columnWidth: 48,
            align: 'left',
            columnTitle: (
              <SelectColumnHeader
                selectAllLabel={t('visualizer.manualEntry.selectAll')}
                bulkActionsLabel={t('visualizer.manualEntry.bulkActions')}
                visibleRowKeys={visibleRowKeys}
                selectedVisibleCount={selectedVisibleCount}
                bulkMenuItems={bulkMenuItems}
                onBulkMenuClick={onBulkMenuClick}
                bulkDisabled={selectedRowKeys.length === 0}
                setSelectedRowKeys={setSelectedRowKeys}
              />
            ),
          },
    [
      isGoogleSheetsReadOnly,
      selectedRowKeys,
      setSelectedRowKeys,
      visibleRowKeys,
      selectedVisibleCount,
      bulkMenuItems,
      onBulkMenuClick,
      t,
    ],
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
      const order = s?.order;
      if (!field || (order !== 'ascend' && order !== 'descend')) {
        setSortedInfo({});
        return;
      }
      setSortedInfo({
        field,
        order,
      });
    },
    [setSortedInfo],
  );

  const dataTable = useMemo(
    () => (
      <Table<DataRow>
        size="small"
        tableLayout="fixed"
        rowKey="key"
        columns={tableColumns}
        dataSource={tableData}
        rowSelection={rowSelection}
        pagination={false}
        scroll={{ x: 'max-content', y: '65vh' }}
        sortDirections={['ascend', 'descend']}
        showSorterTooltip={{ target: 'sorter-icon' }}
        onChange={onTableChange}
        components={isGoogleSheetsReadOnly ? undefined : tableComponents}
        className="[&_.ant-table-cell]:min-w-0 [&_.ant-table-cell]:align-middle [&_.ant-table-tbody_.ant-typography]:text-xs"
        locale={{
          filterReset: t('visualizer.manualEntry.filterReset'),
        }}
      />
    ),
    [
      tableColumns,
      tableData,
      rowSelection,
      onTableChange,
      isGoogleSheetsReadOnly,
      tableComponents,
      t,
    ],
  );

  const handleFooterSave = useCallback(() => {
    handleApplyData();
  }, [handleApplyData]);

  return (
    <AntModal
      title={t('visualizer.manualEntry.title')}
      open={open}
      onCancel={handleCancel}
      closable
      maskClosable={false}
      footer={
        <Footer
          showSave={!isGoogleSheetsReadOnly}
          cancelLabel={t('nav.cancel')}
          saveLabel={t('visualizer.save')}
          onCancel={handleCancel}
          onSave={handleFooterSave}
        />
      }
      centered
      className={`${bodyScrollbarStyles.bodyScrollbar} ${styles.modal} w-4/5! [&_.ant-table-tbody>tr>td.ant-table-cell]:text-xs [&_.ant-table-thead>tr>th]:text-xs`}
      destroyOnHidden
      focusable={{ trap: false }}
    >
      <ConfigProvider theme={tableTheme}>
        <Body
          isGoogleSheetsReadOnly={isGoogleSheetsReadOnly}
          dataTable={dataTable}
          sensors={sensors}
          onDragEnd={onDragEnd}
          canAddMissing={canAddMissing}
          onAddMissingRow={handleAddMissingRow}
        />
      </ConfigProvider>
    </AntModal>
  );
};
