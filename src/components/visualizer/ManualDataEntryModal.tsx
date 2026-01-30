import { type FC, useCallback, useMemo, useState } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Input, InputNumber, Modal, Typography } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import {
  selectData,
  selectSelectedRegionId,
  selectSetVisualizerState,
  useVisualizerStore,
} from '@/store/mapData/store';
import { REGION_OPTIONS } from '@/constants/regions';

type ManualDataRow = {
  id: string;
  regionName: string;
  value: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const ManualDataEntryModal: FC<Props> = ({ open, onClose }) => {
  const data = useVisualizerStore(selectData);
  const setVisualizerState = useVisualizerStore(selectSetVisualizerState);
  const selectedRegionId = useVisualizerStore(selectSelectedRegionId);

  const selectedRegion = useMemo(
    () => REGION_OPTIONS.find((j: DefaultOptionType) => j.value === selectedRegionId),
    [selectedRegionId],
  );

  // Initialize rows from existing region data
  const initialRows = useMemo<ManualDataRow[]>(() => {
    if (data.allIds.length > 0) {
      return data.allIds.map((id) => ({
        id: generateId(),
        regionName: data.byId[id].id,
        value: data.byId[id].value,
      }));
    }
    return [{ id: generateId(), regionName: '', value: 0 }];
  }, [data]);

  const [rows, setRows] = useState<ManualDataRow[]>(initialRows);

  // Reset rows when modal opens with fresh data
  const handleAfterOpenChange = useCallback(
    (visible: boolean) => {
      if (visible) {
        if (data.allIds.length > 0) {
          setRows(
            data.allIds.map((id) => ({
              id: generateId(),
              regionName: data.byId[id].id,
              value: data.byId[id].value,
            })),
          );
        } else {
          setRows([{ id: generateId(), regionName: '', value: 0 }]);
        }
      }
    },
    [data],
  );

  const handleAddDataRow = useCallback(() => {
    setRows((prev) => [...prev, { id: generateId(), regionName: '', value: 0 }]);
  }, []);

  const handleRemoveDataRow = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rowId = e.currentTarget.dataset.id;
    if (rowId) {
      setRows((prev) => prev.filter((row) => row.id !== rowId));
    }
  }, []);

  const handleUpdateDataRow = useCallback(
    (id: string, field: 'regionName' | 'value', value: string | number) => {
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    },
    [],
  );

  const handleClearAllDataRows = useCallback(() => {
    setRows([{ id: generateId(), regionName: '', value: 0 }]);
  }, []);

  const handleApplyData = useCallback(() => {
    const validRows = rows.filter((row) => row.regionName.trim() !== '');
    const allIds = validRows.map((row) => row.regionName.trim());
    const byId = Object.fromEntries(
      validRows.map((row) => [
        row.regionName.trim(),
        { id: row.regionName.trim(), label: row.regionName.trim(), value: row.value },
      ]),
    );
    setVisualizerState({ data: { allIds, byId } });
    onClose();
  }, [rows, setVisualizerState, onClose]);

  const handleCancelDataEntry = useCallback(() => {
    onClose();
  }, [onClose]);

  const regionLabel = selectedRegion?.label ?? 'Selected Region';

  return (
    <Modal
      title={null}
      open={open}
      onCancel={handleCancelDataEntry}
      afterOpenChange={handleAfterOpenChange}
      footer={null}
      width={640}
      destroyOnClose
    >
      <Flex vertical gap="middle">
        {/* Header */}
        <Flex align="flex-start" justify="space-between">
          <Flex vertical>
            <Typography.Title level={2} className="text-primary text-lg font-semibold">
              Manual Data Entry
            </Typography.Title>
            <Typography.Paragraph className="text-sm text-gray-500">
              Edit regional values for {regionLabel}
            </Typography.Paragraph>
          </Flex>
          <Flex gap="small">
            <Button icon={<PlusOutlined />} onClick={handleAddDataRow}>
              Add Row
            </Button>
            <Button icon={<DeleteOutlined />} danger type="text" onClick={handleClearAllDataRows}>
              Clear All
            </Button>
          </Flex>
        </Flex>

        {/* Table */}
        <div className="scrollbar-thin max-h-80 overflow-y-auto">
          {/* Table Header */}
          <div className="gap-sm py-xs sticky top-0 z-10 grid grid-cols-[40px_1fr_140px_40px] items-center bg-white text-xs font-medium tracking-wide text-gray-500 uppercase">
            <Typography.Text className="text-center">#</Typography.Text>
            <Typography.Text>Region Name</Typography.Text>
            <Typography.Text>Value (Numerical)</Typography.Text>
            <Typography.Text />
          </div>

          {/* Table Rows */}
          <Flex vertical gap="small">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="gap-sm grid grid-cols-[40px_1fr_140px_40px] items-center"
              >
                <Typography.Text className="text-center text-sm text-gray-500">
                  {index + 1}
                </Typography.Text>
                <Input
                  value={row.regionName}
                  onChange={(e) => handleUpdateDataRow(row.id, 'regionName', e.target.value)}
                  placeholder="Enter region name"
                />
                <InputNumber
                  value={row.value}
                  onChange={(value) => handleUpdateDataRow(row.id, 'value', value ?? 0)}
                  min={0}
                  className="w-full"
                />
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  danger
                  data-id={row.id}
                  onClick={handleRemoveDataRow}
                  disabled={rows.length <= 1}
                />
              </div>
            ))}
          </Flex>
        </div>

        {/* Footer */}
        <Flex gap="small" justify="flex-end" className="pt-md border-t border-gray-100">
          <Button onClick={handleCancelDataEntry}>Cancel</Button>
          <Button type="primary" onClick={handleApplyData}>
            Apply Data
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default ManualDataEntryModal;
