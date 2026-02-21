import { type FC, useCallback, useState } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Flex,
  Input,
  InputNumber,
  type InputProps,
  Modal,
  type ModalProps,
  Tooltip,
  Typography,
} from 'antd';
import {
  selectClearTimelineData,
  selectData,
  selectSetTimelineData,
  selectSetVisualizerState,
  selectTimelineData,
  selectTimePeriods,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import type { DataSet, RegionData, VisualizerState } from '@/store/mapData/types';
import { generateRandomId } from '@/helpers/common';

type LocalDataState = VisualizerState['data'];

/** One row in the table. timePeriod set when modal reflects or edits timeline data. */
type DataRow = {
  key: string;
  id: string;
  label: string;
  value: number;
  timePeriod?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
};

const createEmptyStaticRow = (): DataRow => ({
  key: generateRandomId(),
  id: '',
  label: '',
  value: 0,
});

/** Flatten timeline data into rows (ID, Label, Time, Value) for display/editing. */
const rowsFromTimeline = (
  timelineData: Record<string, DataSet>,
  timePeriods: string[],
): DataRow[] => {
  const rows: DataRow[] = [];
  for (const period of timePeriods) {
    const data = timelineData[period];
    if (!data) continue;
    for (const regionId of data.allIds) {
      const r = data.byId[regionId];
      if (!r) continue;
      rows.push({
        key: generateRandomId(),
        id: r.id,
        label: r.label,
        value: r.value,
        timePeriod: period,
      });
    }
  }
  return rows;
};

/** Build rows from static data (no time column). */
const rowsFromStaticData = (storeData: LocalDataState): DataRow[] => {
  if (storeData.allIds.length === 0) {
    return [createEmptyStaticRow()];
  }
  return storeData.allIds.map((storeId) => {
    const r = storeData.byId[storeId];
    return {
      key: generateRandomId(),
      id: r.id,
      label: r.label,
      value: r.value,
    };
  });
};

/** Build initial rows when modal opens: use timeline if present, else static data. */
const buildInitialRows = (
  storeData: LocalDataState,
  timelineData: Record<string, DataSet>,
  timePeriods: string[],
): DataRow[] => {
  const hasTimeline = timePeriods.length > 0 && Object.keys(timelineData).length > 0;
  if (hasTimeline) {
    const rows = rowsFromTimeline(timelineData, timePeriods);
    return rows.length > 0 ? rows : [createEmptyStaticRow()];
  }
  return rowsFromStaticData(storeData);
};

const ManualDataEntryModal: FC<Props> = ({ open, onClose, onSave }) => {
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
      title="Manual Data Entry"
      open={open}
      onCancel={handleCancel}
      afterOpenChange={handleAfterOpenChange}
      footer={
        <Flex justify="end" gap="middle">
          <Button onClick={handleCancel}>Cancel</Button>
          <Button type="primary" onClick={handleApplyData}>
            Done
          </Button>
        </Flex>
      }
      centered
      className="w-4/5! lg:w-2/3!"
      destroyOnHidden
    >
      <Flex vertical gap="small" className="py-md">
        <Flex gap={4} justify="end">
          <Tooltip title="Clear All">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={handleClearAll}
            />
          </Tooltip>
          <Tooltip title="Add Row">
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
            <Typography.Text className="text-center">#</Typography.Text>
            <Typography.Text>ID</Typography.Text>
            <Typography.Text>Label</Typography.Text>
            <Typography.Text>Value</Typography.Text>
            {isTimelineMode && <Typography.Text>Time</Typography.Text>}
            <Typography.Text />
          </div>

          <Flex vertical gap="small">
            {rows.map((row, index) => (
              <div
                key={row.key}
                data-rowkey={row.key}
                className={`gap-sm grid ${gridCols} items-center`}
              >
                <Typography.Text className="text-center text-sm text-gray-500">
                  {index + 1}
                </Typography.Text>
                <Input
                  value={row.id}
                  data-rowkey={row.key}
                  readOnly
                  placeholder="Region ID"
                  className="bg-gray-50"
                />
                <Input
                  value={row.label}
                  data-rowkey={row.key}
                  onChange={handleLabelChange}
                  placeholder="Label"
                />
                <InputNumber
                  value={row.value}
                  onChange={(value: number | null) => handleValueChange(row.key, value)}
                  min={0}
                  className="w-full"
                />
                {isTimelineMode && (
                  <Input
                    value={row.timePeriod ?? ''}
                    data-rowkey={row.key}
                    onChange={handleTimePeriodChange}
                    placeholder="e.g. 2020"
                  />
                )}
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  danger
                  data-rowkey={row.key}
                  onClick={handleRemoveRow}
                  disabled={rows.length <= 1}
                />
              </div>
            ))}
          </Flex>
        </div>

        <Tooltip title="Add Row">
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddRow} className="w-full" />
        </Tooltip>
      </Flex>
    </Modal>
  );
};

export default ManualDataEntryModal;
