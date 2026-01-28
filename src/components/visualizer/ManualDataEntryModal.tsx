import { type FC, useCallback, useMemo, useState } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, InputNumber, Modal } from 'antd';
import { useVisualizerStore } from '@/store/useVisualizerStore';

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

export const ManualDataEntryModal: FC<Props> = ({ open, onClose }) => {
  const regionData = useVisualizerStore((state) => state.regionData);
  const setRegionData = useVisualizerStore((state) => state.setRegionData);
  const selectedJurisdiction = useVisualizerStore((state) => state.selectedJurisdiction);

  // Initialize rows from existing region data
  const initialRows = useMemo<ManualDataRow[]>(() => {
    if (regionData.length > 0) {
      return regionData.map((data) => ({
        id: generateId(),
        regionName: data.regionId,
        value: data.value,
      }));
    }
    return [{ id: generateId(), regionName: '', value: 0 }];
  }, [regionData]);

  const [rows, setRows] = useState<ManualDataRow[]>(initialRows);

  // Reset rows when modal opens with fresh data
  const handleAfterOpenChange = useCallback(
    (visible: boolean) => {
      if (visible) {
        if (regionData.length > 0) {
          setRows(
            regionData.map((data) => ({
              id: generateId(),
              regionName: data.regionId,
              value: data.value,
            })),
          );
        } else {
          setRows([{ id: generateId(), regionName: '', value: 0 }]);
        }
      }
    },
    [regionData],
  );

  const handleAddRow = useCallback(() => {
    setRows((prev) => [...prev, { id: generateId(), regionName: '', value: 0 }]);
  }, []);

  const handleRemoveRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const handleUpdateRow = useCallback(
    (id: string, field: 'regionName' | 'value', value: string | number) => {
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    },
    [],
  );

  const handleClearAll = useCallback(() => {
    setRows([{ id: generateId(), regionName: '', value: 0 }]);
  }, []);

  const handleApply = useCallback(() => {
    const validData = rows
      .filter((row) => row.regionName.trim() !== '')
      .map((row) => ({
        regionId: row.regionName.trim(),
        value: row.value,
      }));
    setRegionData(validData);
    onClose();
  }, [rows, setRegionData, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const jurisdictionLabel = selectedJurisdiction?.label ?? 'Selected Region';

  return (
    <Modal
      title={null}
      open={open}
      onCancel={handleCancel}
      afterOpenChange={handleAfterOpenChange}
      footer={null}
      width={640}
      destroyOnClose
    >
      <div className="space-y-md">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-primary text-lg font-semibold">Manual Data Entry</h2>
            <p className="text-sm text-gray-500">Edit regional values for {jurisdictionLabel}</p>
          </div>
          <div className="gap-sm flex">
            <Button icon={<PlusOutlined />} onClick={handleAddRow}>
              Add Row
            </Button>
            <Button icon={<DeleteOutlined />} danger type="text" onClick={handleClearAll}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="scrollbar-thin max-h-80 overflow-y-auto">
          {/* Table Header */}
          <div className="gap-sm py-xs sticky top-0 z-10 grid grid-cols-[40px_1fr_140px_40px] items-center bg-white text-xs font-medium tracking-wide text-gray-500 uppercase">
            <span className="text-center">#</span>
            <span>Region Name</span>
            <span>Value (Numerical)</span>
            <span />
          </div>

          {/* Table Rows */}
          <div className="space-y-xs">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="gap-sm grid grid-cols-[40px_1fr_140px_40px] items-center"
              >
                <span className="text-center text-sm text-gray-500">{index + 1}</span>
                <Input
                  value={row.regionName}
                  onChange={(e) => handleUpdateRow(row.id, 'regionName', e.target.value)}
                  placeholder="Enter region name"
                />
                <InputNumber
                  value={row.value}
                  onChange={(value) => handleUpdateRow(row.id, 'value', value ?? 0)}
                  min={0}
                  className="w-full"
                />
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => handleRemoveRow(row.id)}
                  disabled={rows.length <= 1}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="gap-sm pt-md flex justify-end border-t border-gray-100">
          <Button onClick={handleCancel}>Cancel</Button>
          <Button type="primary" onClick={handleApply}>
            Apply Data
          </Button>
        </div>
      </div>
    </Modal>
  );
};
