import { type FC, useCallback, useState } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Flex,
  Input,
  InputNumber,
  type InputNumberProps,
  type InputProps,
  Modal,
  type ModalProps,
  Tooltip,
  Typography,
} from 'antd';
import { selectData, selectSetVisualizerState, useVisualizerStore } from '@/store/mapData/store';
import type { RegionData, VisualizerState } from '@/store/mapData/types';
import { generateRandomId } from '@/helpers/common';

type LocalDataState = VisualizerState['data'];

type Props = {
  open: boolean;
  onClose: () => void;
};

const createEmptyRow = (): RegionData => ({
  id: generateRandomId(),
  label: '',
  value: 0,
});

const initializeLocalData = (storeData: LocalDataState): LocalDataState => {
  if (storeData.allIds.length > 0) {
    // Create new IDs for local editing to avoid conflicts
    const allIds: string[] = [];
    const byId: Record<string, RegionData> = {};

    storeData.allIds.forEach((storeId) => {
      const localId = generateRandomId();
      allIds.push(localId);
      byId[localId] = {
        id: localId,
        label: storeData.byId[storeId].label,
        value: storeData.byId[storeId].value,
      };
    });

    return { allIds, byId };
  }

  const emptyRow = createEmptyRow();
  return {
    allIds: [emptyRow.id],
    byId: { [emptyRow.id]: emptyRow },
  };
};

const ManualDataEntryModal: FC<Props> = ({ open, onClose }) => {
  const storeData = useVisualizerStore(selectData);
  const setVisualizerState = useVisualizerStore(selectSetVisualizerState);

  // Local normalized state matching store structure
  const [localData, setLocalData] = useState<LocalDataState>(() => initializeLocalData(storeData));

  // Reset local data when modal opens with fresh store data
  const handleAfterOpenChange: ModalProps['afterOpenChange'] = useCallback(
    (visible) => {
      if (visible) {
        setLocalData(initializeLocalData(storeData));
      }
    },
    [storeData],
  );

  const handleAddDataRow = useCallback(() => {
    const newRow = createEmptyRow();
    setLocalData((prev) => ({
      allIds: [...prev.allIds, newRow.id],
      byId: { ...prev.byId, [newRow.id]: newRow },
    }));
  }, []);

  const handleRemoveDataRow = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rowId = e.currentTarget.dataset.id;
    if (rowId) {
      setLocalData((prev) => {
        const { [rowId]: _, ...restById } = prev.byId;
        return {
          allIds: prev.allIds.filter((id) => id !== rowId),
          byId: restById,
        };
      });
    }
  }, []);

  const handleIdChange: InputProps['onChange'] = useCallback((e) => {
    const rowId = e.currentTarget.dataset.id;
    if (rowId) {
      setLocalData((prev) => ({
        ...prev,
        byId: {
          ...prev.byId,
          [rowId]: { ...prev.byId[rowId], label: e.target.value },
        },
      }));
    }
  }, []);

  const handleLabelChange: InputProps['onChange'] = useCallback((e) => {
    const rowId = e.currentTarget.dataset.id;
    if (rowId) {
      setLocalData((prev) => ({
        ...prev,
        byId: {
          ...prev.byId,
          [rowId]: { ...prev.byId[rowId], label: e.target.value },
        },
      }));
    }
  }, []);

  const handleValueChange = useCallback((rowId: string, value: number | null) => {
    setLocalData((prev) => ({
      ...prev,
      byId: {
        ...prev.byId,
        [rowId]: { ...prev.byId[rowId], value: value ?? 0 },
      },
    }));
  }, []);

  const handleClearAllDataRows = useCallback(() => {
    const emptyRow = createEmptyRow();
    setLocalData({
      allIds: [emptyRow.id],
      byId: { [emptyRow.id]: emptyRow },
    });
  }, []);

  const handleApplyData = useCallback(() => {
    // Transform local data to store format (use label as the actual ID in store)
    const validEntries = localData.allIds
      .map((id) => localData.byId[id])
      .filter((row) => row.label.trim() !== '');

    const allIds = validEntries.map((row) => row.label.trim());
    const byId = Object.fromEntries(
      validEntries.map((row) => [
        row.label.trim(),
        { id: row.label.trim(), label: row.label.trim(), value: row.value },
      ]),
    );

    setVisualizerState({ data: { allIds, byId } });
    onClose();
  }, [localData, setVisualizerState, onClose]);

  const handleCancelDataEntry = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal
      title="Manual Data Entry"
      open={open}
      onCancel={handleCancelDataEntry}
      afterOpenChange={handleAfterOpenChange}
      footer={
        <Flex justify="end" gap="middle">
          <Button onClick={handleCancelDataEntry}>Cancel</Button>
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
        {/* Actions Row */}
        <Flex gap={4} justify="end">
          <Tooltip title="Clear All">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={handleClearAllDataRows}
            />
          </Tooltip>
          <Tooltip title="Add Row">
            <Button
              type="text"
              icon={<PlusOutlined />}
              size="small"
              onClick={handleAddDataRow}
              className="text-gray-500"
            />
          </Tooltip>
        </Flex>

        {/* Table */}
        <div className="scrollbar-thin max-h-80 overflow-y-auto">
          {/* Table Header */}
          <div className="gap-sm py-xs sticky top-0 z-10 grid grid-cols-[40px_1fr_1fr_120px_40px] items-center bg-white text-xs font-medium tracking-wide text-gray-500 uppercase">
            <Typography.Text className="text-center">#</Typography.Text>
            <Typography.Text>ID</Typography.Text>
            <Typography.Text>Label</Typography.Text>
            <Typography.Text>Value</Typography.Text>
            <Typography.Text />
          </div>

          {/* Table Rows */}
          <Flex vertical gap="small">
            {localData.allIds.map((rowId, index) => {
              const row = localData.byId[rowId];
              return (
                <div
                  key={rowId}
                  data-id={rowId}
                  className="gap-sm grid grid-cols-[40px_1fr_1fr_120px_40px] items-center"
                >
                  <Typography.Text className="text-center text-sm text-gray-500">
                    {index + 1}
                  </Typography.Text>
                  <Input
                    value={row.label}
                    data-id={rowId}
                    onChange={handleIdChange}
                    placeholder="Region ID"
                  />
                  <Input
                    value={row.label}
                    data-id={rowId}
                    onChange={handleLabelChange}
                    placeholder="Region label"
                  />
                  <InputNumber
                    value={row.value}
                    onChange={(value) => handleValueChange(rowId, value)}
                    min={0}
                    className="w-full"
                  />
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    danger
                    data-id={rowId}
                    onClick={handleRemoveDataRow}
                    disabled={localData.allIds.length <= 1}
                  />
                </div>
              );
            })}
          </Flex>
        </div>

        {/* Add Row Button after list */}
        <Tooltip title="Add Row">
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddDataRow}
            className="w-full"
          />
        </Tooltip>
      </Flex>
    </Modal>
  );
};

export default ManualDataEntryModal;
