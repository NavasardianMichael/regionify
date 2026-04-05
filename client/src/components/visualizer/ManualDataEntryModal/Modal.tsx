import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { DndContext } from '@dnd-kit/core';
import type { TablePaginationConfig, TableProps } from 'antd';
import {
  Alert,
  Button,
  ConfigProvider,
  Flex,
  Input,
  Modal,
  Radio,
  type RadioChangeEvent,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import type { FilterValue, SorterResult, TableCurrentDataSource } from 'antd/es/table/interface';
import { useVisualizerStore } from '@/store/mapData/store';
import { IMPORT_DATA_TYPES } from '@/constants/data';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { commitParsedImport } from '@/helpers/commitParsedImport';
import { parseCSV } from '@/helpers/importDataParsers';
import type { DataRow } from '@/helpers/manualDataEntryHelpers';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { showMessageWithClose } from '@/components/visualizer/ImportDataPanel/importDataPanelUtils';
import { SelectColumnHeader } from './SelectColumnHeader';
import { createSortableTbodyWrapper, SortableBodyRow, useTableDnd } from './tableDnD';
import { tableTheme } from './tableTheme';
import { useModalState } from './useModalState';
import { useTableColumns } from './useTableColumns';
import styles from './Modal.module.css';

type EntryMode = 'table' | 'text';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
  mapRegionIds: string[];
  historicalDataImport: boolean;
  /** Live Google Sheet sync — table is view-only; edits happen in the sheet. */
  googleSheetsSyncReadOnly?: boolean;
};

const ManualDataEntryModal: FC<Props> = ({
  open,
  onClose,
  onSave,
  mapRegionIds,
  historicalDataImport,
  googleSheetsSyncReadOnly = false,
}) => {
  const { t } = useTypedTranslation();
  const { message: messageApi } = useAppFeedback();
  const setVisualizerState = useVisualizerStore((s) => s.setVisualizerState);

  const [entryMode, setEntryMode] = useState<EntryMode>('table');
  const [pastedText, setPastedText] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteSaving, setPasteSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEntryMode('table');
    setPastedText('');
    setPasteError(null);
    setPasteSaving(false);
  }, [open]);

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

  const handleApplyPastedText = useCallback(async () => {
    setPasteError(null);
    const trimmed = pastedText.trim();
    if (!trimmed) {
      setPasteError(t('visualizer.manualEntry.pasteFormatError'));
      return;
    }

    setPasteSaving(true);
    try {
      const result = parseCSV(trimmed);
      if (typeof result === 'object' && 'error' in result) {
        setPasteError(t('visualizer.manualEntry.pasteMissingId'));
        return;
      }
      if (result.length === 0) {
        setPasteError(t('visualizer.manualEntry.pasteFormatError'));
        return;
      }

      const outcome = commitParsedImport(result, mapRegionIds, historicalDataImport);
      if (!outcome.ok) {
        setPasteError(t('visualizer.manualEntry.pasteFormatError'));
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

      setVisualizerState({ importDataType: IMPORT_DATA_TYPES.manual });
      onSave?.();
      onClose();
    } finally {
      setPasteSaving(false);
    }
  }, [
    pastedText,
    mapRegionIds,
    historicalDataImport,
    messageApi,
    onSave,
    onClose,
    setVisualizerState,
    t,
  ]);

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

  const onEntryModeChange = useCallback((e: RadioChangeEvent) => {
    setEntryMode(e.target.value as EntryMode);
    setPasteError(null);
  }, []);

  const handleFooterSave = useCallback(() => {
    if (entryMode === 'text') {
      void handleApplyPastedText();
      return;
    }
    handleApplyData();
  }, [entryMode, handleApplyData, handleApplyPastedText]);

  const saveLoading = entryMode === 'text' && pasteSaving;

  return (
    <Modal
      title={t('visualizer.manualEntry.title')}
      open={open}
      onCancel={handleCancel}
      closable
      maskClosable={false}
      footer={
        <Flex justify="flex-end" gap="small">
          <Button onClick={handleCancel}>{t('nav.cancel')}</Button>
          {isGoogleSheetsReadOnly ? null : (
            <Button type="primary" onClick={handleFooterSave} loading={saveLoading}>
              {t('visualizer.save')}
            </Button>
          )}
        </Flex>
      }
      centered
      className={`${styles.modal} w-4/5! [&_.ant-table-tbody>tr>td.ant-table-cell]:text-xs [&_.ant-table-thead>tr>th]:text-xs`}
      destroyOnHidden
      focusable={{ trap: false }}
    >
      <ConfigProvider theme={tableTheme}>
        <Flex vertical gap="small" className="py-md">
          {isGoogleSheetsReadOnly ? null : (
            <Radio.Group
              value={entryMode}
              onChange={onEntryModeChange}
              options={[
                { value: 'table', label: t('visualizer.manualEntry.modeTable') },
                { value: 'text', label: t('visualizer.manualEntry.modeText') },
              ]}
            />
          )}

          {isGoogleSheetsReadOnly ? (
            <Alert
              type="info"
              showIcon
              className="manual-entry-google-sync-alert border-primary/30! bg-primary/10! [&_.ant-alert-icon]:text-primary! [&_.ant-alert-title]:text-primary [&_.ant-alert-info]:bg-transparent! [&_.ant-alert-title]:mb-0!"
              title={
                <Typography.Text className="text-primary text-sm">
                  {t('visualizer.manualEntry.googleSheetsSyncReadOnlyNote')}
                </Typography.Text>
              }
            />
          ) : null}

          {entryMode === 'text' && !isGoogleSheetsReadOnly ? (
            <Flex vertical gap="small" className="w-full">
              <div className="relative w-full">
                <Tooltip title={t('visualizer.manualEntry.pasteFormatTooltip')}>
                  <Button
                    type="text"
                    size="small"
                    icon={<InfoCircleOutlined />}
                    className="absolute end-2 top-2 z-10 text-gray-500"
                    aria-label={t('visualizer.manualEntry.pasteFormatAria')}
                  />
                </Tooltip>
                <Input.TextArea
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    if (pasteError) setPasteError(null);
                  }}
                  placeholder={t('visualizer.manualEntry.pastePlaceholder')}
                  rows={14}
                  className="pe-10 font-mono text-sm"
                />
              </div>
              {pasteError ? (
                <Typography.Text type="danger" className="text-sm">
                  {pasteError}
                </Typography.Text>
              ) : null}
            </Flex>
          ) : null}

          {entryMode === 'table' || isGoogleSheetsReadOnly ? (
            <>
              {isGoogleSheetsReadOnly ? (
                dataTable
              ) : (
                <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                  {dataTable}
                </DndContext>
              )}

              {canAddMissing && !isGoogleSheetsReadOnly ? (
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleAddMissingRow}
                  className="mt-1! w-fit self-start"
                  aria-label={t('visualizer.manualEntry.addMissingRow')}
                >
                  {t('visualizer.manualEntry.addMissingRow')}
                </Button>
              ) : null}
            </>
          ) : null}
        </Flex>
      </ConfigProvider>
    </Modal>
  );
};

export default ManualDataEntryModal;
