import { type FC, useCallback, useState } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, type InputProps, Modal, type ModalProps, Tooltip, Typography } from 'antd';
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
  createEmptyStaticRow,
  type DataRow,
} from '@/helpers/manualDataEntryHelpers';
import { ManualDataEntryRow } from '@/components/visualizer/ManualDataEntryModal/ManualDataEntryRow';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
};

const ManualDataEntryModal: FC<Props> = ({ open, onClose, onSave }) => {
  const { t } = useTypedTranslation();
  const storeData = useVisualizerStore(selectData);
  const timelineData = useVisualizerStore(selectTimelineData);
  const timePeriods = useVisualizerStore(selectTimePeriods);
  const setVisualizerState = useVisualizerStore(selectSetVisualizerState);
  const setTimelineData = useVisualizerStore(selectSetTimelineData);
  const clearTimelineData = useVisualizerStore(selectClearTimelineData);

  const [rows, setRows] = useState<DataRow[]>(() =>
    buildInitialRows(storeData, timelineData, timePeriods),
  );

  /** True when modal was opened with timeline data; keeps Time column visible and save as timeline. */
  const [isTimelineMode, setIsTimelineMode] = useState(false);

  const gridCols = isTimelineMode
    ? 'grid-cols-[40px_1fr_1fr_120px_1fr_40px]'
    : 'grid-cols-[40px_1fr_1fr_120px_40px]';

  const handleAfterOpenChange: ModalProps['afterOpenChange'] = useCallback(
    (visible: boolean) => {
      if (visible) {
        const hasTimeline = timePeriods.length > 0 && Object.keys(timelineData).length > 0;
        setIsTimelineMode(hasTimeline);
        setRows(buildInitialRows(storeData, timelineData, timePeriods));
      }
    },
    [storeData, timelineData, timePeriods],
  );

  const handleAddRow = useCallback(() => {
    const defaultTime = timePeriods.length > 0 ? timePeriods[0] : undefined;
    setRows((prev) => [
      ...prev,
      {
        key: generateRandomId(),
        id: '',
        label: '',
        value: 0,
        ...(isTimelineMode ? { timePeriod: defaultTime ?? '' } : {}),
      },
    ]);
  }, [timePeriods, isTimelineMode]);

  const handleRemoveRow = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const key = e.currentTarget.dataset.rowkey;
    if (key) {
      setRows((prev) => {
        const next = prev.filter((r) => r.key !== key);
        return next.length > 0 ? next : [createEmptyStaticRow()];
      });
    }
  }, []);

  const handleLabelChange: InputProps['onChange'] = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const key = e.currentTarget.dataset.rowkey;
      if (key) {
        setRows((prev) => prev.map((r) => (r.key === key ? { ...r, label: e.target.value } : r)));
      }
    },
    [],
  );

  const handleValueChange = useCallback((rowKey: string, value: number | null) => {
    setRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, value: value ?? 0 } : r)));
  }, []);

  const handleTimePeriodChange: InputProps['onChange'] = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const key = e.currentTarget.dataset.rowkey;
      if (key) {
        setRows((prev) =>
          prev.map((r) => (r.key === key ? { ...r, timePeriod: e.target.value } : r)),
        );
      }
    },
    [],
  );

  const handleClearAll = useCallback(() => {
    const defaultTime = timePeriods.length > 0 ? timePeriods[0] : undefined;
    setRows([
      {
        ...createEmptyStaticRow(),
        ...(isTimelineMode ? { timePeriod: defaultTime ?? '' } : {}),
      },
    ]);
  }, [timePeriods, isTimelineMode]);

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

    if (isTimelineMode) {
      const byPeriod = new Map<string, { id: string; label: string; value: number }[]>();
      for (const r of valid) {
        const period = (r.timePeriod ?? '').trim();
        if (!byPeriod.has(period)) byPeriod.set(period, []);
        byPeriod.get(period)!.push({
          id: r.id.trim(),
          label: r.label.trim(),
          value: r.value,
        });
      }
      const periods = Array.from(byPeriod.keys()).sort();
      const newTimelineData: Record<string, DataSet> = {};
      for (const period of periods) {
        const entries = byPeriod.get(period)!;
        const allIds = entries.map((e) => e.id);
        const byId: Record<string, RegionData> = {};
        for (const e of entries) {
          byId[e.id] = { id: e.id, label: e.label, value: e.value };
        }
        newTimelineData[period] = { allIds, byId };
      }
      setTimelineData(newTimelineData, periods);
    } else {
      clearTimelineData();
      const allIds = valid.map((r) => r.id.trim());
      const byId = Object.fromEntries(
        valid.map((r) => [r.id.trim(), { id: r.id.trim(), label: r.label.trim(), value: r.value }]),
      );
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
    onSave,
    onClose,
  ]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal
      title={t('visualizer.manualEntry.title')}
      open={open}
      onCancel={handleCancel}
      afterOpenChange={handleAfterOpenChange}
      footer={
        <Flex justify="end" gap="middle">
          <Button onClick={handleCancel}>{t('nav.cancel')}</Button>
          <Button type="primary" onClick={handleApplyData}>
            {t('visualizer.done')}
          </Button>
        </Flex>
      }
      centered
      className="w-4/5! lg:w-2/3!"
      destroyOnHidden
    >
      <Flex vertical gap="small" className="py-md">
        <Flex gap={4} justify="end">
          <Tooltip title={t('visualizer.manualEntry.clearAll')}>
            <Button
              type="text"
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={handleClearAll}
            />
          </Tooltip>
          <Tooltip title={t('visualizer.manualEntry.addRow')}>
            <Button
              type="text"
              icon={<PlusOutlined />}
              size="small"
              onClick={handleAddRow}
              className="text-gray-500"
            />
          </Tooltip>
        </Flex>

        <div className="scrollbar-thin max-h-80 overflow-y-auto">
          <div
            className={`gap-sm py-xs sticky top-0 z-10 grid ${gridCols} items-center bg-white text-xs font-medium tracking-wide text-gray-500 uppercase`}
          >
            <Typography.Text className="text-center">
              {t('visualizer.manualEntry.colIndex')}
            </Typography.Text>
            <Typography.Text>{t('visualizer.manualEntry.colId')}</Typography.Text>
            <Typography.Text>{t('visualizer.manualEntry.colLabel')}</Typography.Text>
            <Typography.Text>{t('visualizer.manualEntry.colValue')}</Typography.Text>
            {isTimelineMode && (
              <Typography.Text>{t('visualizer.manualEntry.colTime')}</Typography.Text>
            )}
            <Typography.Text />
          </div>

          <Flex vertical gap="small">
            {rows.map((row, index) => (
              <ManualDataEntryRow
                key={row.key}
                row={row}
                index={index}
                isTimelineMode={isTimelineMode}
                gridCols={gridCols}
                onLabelChange={handleLabelChange}
                onValueChange={handleValueChange}
                onTimePeriodChange={handleTimePeriodChange}
                onRemove={handleRemoveRow}
                canRemove={rows.length > 1}
              />
            ))}
          </Flex>
        </div>

        <Tooltip title={t('visualizer.manualEntry.addRow')}>
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddRow} className="w-full" />
        </Tooltip>
      </Flex>
    </Modal>
  );
};

export default ManualDataEntryModal;
