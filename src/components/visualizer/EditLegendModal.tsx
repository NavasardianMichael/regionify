import { type FC, useCallback, useMemo, useState } from 'react';
import {
  DeleteOutlined,
  HolderOutlined,
  PlusOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import { Button, ColorPicker, Flex, Input, InputNumber, Modal, Tooltip, Typography } from 'antd';
import type { LegendItem } from '@/store/legendData/types';

type Props = {
  open: boolean;
  items: LegendItem[];
  onSave: (items: LegendItem[]) => void;
  onCancel: () => void;
};

const generateId = () => `legend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const EditLegendModal: FC<Props> = ({ open, items, onSave, onCancel }) => {
  const [localItems, setLocalItems] = useState<LegendItem[]>(() => [...items]);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Reset local state when modal opens with fresh items
  const handleAfterOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setLocalItems([...items]);
      }
    },
    [items],
  );

  const handleAddLegendRange = useCallback(() => {
    const newItem: LegendItem = {
      id: generateId(),
      name: 'New Range',
      min: 0,
      max: 100,
      color: '#6B7280',
    };
    setLocalItems((prev) => [...prev, newItem]);
  }, []);

  const handleUpdateLegendRange = useCallback((id: string, updates: Partial<LegendItem>) => {
    setLocalItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const handleRemoveLegendRange = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const id = e.currentTarget.dataset.id;
    if (id) {
      setLocalItems((prev) => prev.filter((item) => item.id !== id));
    }
  }, []);

  const handleSortLegendRanges = useCallback(() => {
    setLocalItems((prev) => {
      const sorted = [...prev].sort((a, b) =>
        sortDirection === 'asc' ? a.min - b.min : b.min - a.min,
      );
      return sorted;
    });
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, [sortDirection]);

  const handleReorderLegendRange = useCallback((fromIndex: number, toIndex: number) => {
    setLocalItems((prev) => {
      const newItems = [...prev];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      return newItems;
    });
  }, []);

  const handleDragStartLegendRange = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const index = e.currentTarget.dataset.index;
    if (index !== undefined) {
      setDraggedIndex(parseInt(index, 10));
    }
  }, []);

  const handleDragOverLegendRange = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const index = e.currentTarget.dataset.index;
      if (index !== undefined) {
        const targetIndex = parseInt(index, 10);
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
          handleReorderLegendRange(draggedIndex, targetIndex);
          setDraggedIndex(targetIndex);
        }
      }
    },
    [draggedIndex, handleReorderLegendRange],
  );

  const handleDragEndLegendRange = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleSaveLegendRanges = useCallback(() => {
    onSave(localItems);
  }, [localItems, onSave]);

  const canDelete = useMemo(() => localItems.length > 1, [localItems.length]);

  return (
    <Modal
      title={
        <Flex align="center" justify="space-between" className="pr-md">
          <Typography.Text className="text-lg font-semibold">Edit Legend Ranges</Typography.Text>
          <Flex gap={4}>
            <Tooltip title={sortDirection === 'asc' ? 'Sort Ascending' : 'Sort Descending'}>
              <Button
                type="text"
                icon={
                  sortDirection === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />
                }
                size="small"
                onClick={handleSortLegendRanges}
                className="text-gray-500"
              />
            </Tooltip>
            <Tooltip title="Add Range">
              <Button
                type="text"
                icon={<PlusOutlined />}
                size="small"
                onClick={handleAddLegendRange}
                className="text-gray-500"
              />
            </Tooltip>
          </Flex>
        </Flex>
      }
      open={open}
      onCancel={onCancel}
      afterOpenChange={handleAfterOpenChange}
      footer={
        <Flex justify="end" gap="small">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={handleSaveLegendRanges}>
            Done
          </Button>
        </Flex>
      }
      width={700}
      destroyOnHidden
    >
      <Flex vertical gap="small" className="py-md">
        {/* Header */}
        <div className="gap-sm grid grid-cols-[24px_1fr_100px_100px_60px_32px] items-center px-2 text-xs font-medium text-gray-500">
          <Typography.Text />
          <Typography.Text>Name</Typography.Text>
          <Typography.Text>Min Value</Typography.Text>
          <Typography.Text>Max Value</Typography.Text>
          <Typography.Text>Color</Typography.Text>
          <Typography.Text />
        </div>

        {/* Legend Items */}
        <Flex vertical gap="small" className="max-h-96 overflow-y-auto">
          {localItems.map((item, index) => (
            <div
              key={item.id}
              data-id={item.id}
              data-index={index}
              draggable
              onDragStart={handleDragStartLegendRange}
              onDragOver={handleDragOverLegendRange}
              onDragEnd={handleDragEndLegendRange}
              className={`gap-sm grid grid-cols-[24px_1fr_100px_100px_60px_32px] items-center rounded-md border border-gray-200 bg-gray-50 p-2 transition-opacity ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <HolderOutlined className="cursor-grab text-gray-400 active:cursor-grabbing" />
              <Input
                value={item.name}
                onChange={(e) => handleUpdateLegendRange(item.id, { name: e.target.value })}
                placeholder="Name"
                size="middle"
              />
              <InputNumber
                value={item.min}
                onChange={(value) => handleUpdateLegendRange(item.id, { min: value ?? 0 })}
                min={0}
                controls={false}
                className="w-full"
              />
              <InputNumber
                value={item.max}
                onChange={(value) => handleUpdateLegendRange(item.id, { max: value ?? 0 })}
                min={0}
                controls={false}
                className="w-full"
              />
              <ColorPicker
                value={item.color}
                onChange={(color) =>
                  handleUpdateLegendRange(item.id, { color: color.toHexString() })
                }
                size="small"
              />
              <Tooltip title="Remove">
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                  data-id={item.id}
                  onClick={handleRemoveLegendRange}
                  disabled={!canDelete}
                />
              </Tooltip>
            </div>
          ))}
        </Flex>

        {/* Add Range Button after list */}
        <Tooltip title="Add Range">
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddLegendRange}
            className="w-full"
          />
        </Tooltip>
      </Flex>
    </Modal>
  );
};

export default EditLegendModal;
