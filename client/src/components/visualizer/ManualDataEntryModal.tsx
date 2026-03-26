import { type FC, startTransition, useCallback, useMemo, useState } from 'react';
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
  findFirstMissingDataSlot,
} from '@/helpers/manualDataEntryHelpers';
import { ManualDataEntryRow } from '@/components/visualizer/ManualDataEntryModal/ManualDataEntryRow';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
  mapRegionIds: string[];
  historicalDataImport: boolean;
};

const ManualDataEntryModal: FC<Props> = ({
  open,
  onClose,
  onSave,
  mapRegionIds,
  historicalDataImport,
}) => {
  const { t } = useTypedTranslation();
  const storeData = useVisualizerStore(selectData);
  const timelineData = useVisualizerStore(selectTimelineData);
  const timePeriods = useVisualizerStore(selectTimePeriods);
  const setVisualizerState = useVisualizerStore(selectSetVisualizerState);
  const setTimelineData = useVisualizerStore(selectSetTimelineData);
  const clearTimelineData = useVisualizerStore(selectClearTimelineData);

  const [rows, setRows] = useState<DataRow[]>(() =>
    buildInitialRows(storeData, timelineData, timePeriods, historicalDataImport),
  );

  /** Timeline column and save mode when store has timeline and plan allows time series. */
  const [isTimelineMode, setIsTimelineMode] = useState(false);

  const gridCols = isTimelineMode
    ? 'grid-cols-[40px_1fr_1fr_1fr_1fr_40px]'
    : 'grid-cols-[40px_1fr_1fr_120px_40px]';

  const canAddMissing = useMemo(
    () =>
      mapRegionIds.length > 0 &&
      findFirstMissingDataSlot(rows, mapRegionIds, isTimelineMode, timePeriods) !== null,
    [rows, mapRegionIds, isTimelineMode, timePeriods],
  );

  const handleAfterOpenChange: ModalProps['afterOpenChange'] = useCallback(
    (visible: boolean) => {
      if (visible) {
        const hasTimeline =
          historicalDataImport && timePeriods.length > 0 && Object.keys(timelineData).length > 0;
        setIsTimelineMode(hasTimeline);
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

  const handleToggleChartVisibility = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const key = e.currentTarget.dataset.rowkey;
    if (!key) return;
    startTransition(() => {
      setRows((prev) => prev.map((r) => (r.key === key ? { ...r, hidden: r.hidden !== true } : r)));
    });
  }, []);

  const handleLabelChange: InputProps['onChange'] = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const key = e.currentTarget.dataset.rowkey;
      if (!key) return;
      const nextLabel = e.target.value;
      startTransition(() => {
        setRows((prev) => prev.map((r) => (r.key === key ? { ...r, label: nextLabel } : r)));
      });
    },
    [],
  );

  const handleValueChange = useCallback((rowKey: string, value: number | null) => {
    startTransition(() => {
      setRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, value: value ?? 0 } : r)));
    });
  }, []);

  const handleClearAll = useCallback(() => {
    const defaultTime = timePeriods.length > 0 ? timePeriods[0] : undefined;
    setRows([
      {
        ...createEmptyStaticRow(),
        ...(isTimelineMode ? { timePeriod: defaultTime ?? '' } : {}),
      },
    ]);
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
          <Tooltip title={t('visualizer.manualEntry.addMissingRow')}>
            <Button
              type="text"
              icon={<PlusOutlined />}
              size="small"
              onClick={handleAddMissingRow}
              disabled={!canAddMissing}
              className="text-gray-500"
              aria-label={t('visualizer.manualEntry.addMissingRow')}
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
                onToggleChartVisibility={handleToggleChartVisibility}
              />
            ))}
          </Flex>
        </div>

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddMissingRow}
          disabled={!canAddMissing}
          className="w-full"
          aria-label={t('visualizer.manualEntry.addMissingRow')}
        >
          {t('visualizer.manualEntry.addMissingRow')}
        </Button>
      </Flex>
    </Modal>
  );
};

export default ManualDataEntryModal;
