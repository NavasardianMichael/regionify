import { type FC, lazy, Suspense, useCallback, useMemo, useState } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  HolderOutlined,
  PlusOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import { Button, ColorPicker, Flex, InputNumber, Spin, Tooltip, Typography } from 'antd';
import { useLegendDataStore } from '@/store/legendData/store';
import type { LegendItem } from '@/store/legendData/types';

const EditLegendItemModal = lazy(() => import('./EditLegendItemModal'));

const LegendConfigPanel: FC = () => {
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LegendItem | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const items = useLegendDataStore((state) => state.items);
  const addItem = useLegendDataStore((state) => state.addItem);
  const updateItem = useLegendDataStore((state) => state.updateItem);
  const removeItem = useLegendDataStore((state) => state.removeItem);
  const reorderItems = useLegendDataStore((state) => state.reorderItems);
  const sortItems = useLegendDataStore((state) => state.sortItems);

  const legendItems = useMemo(
    () => items.allIds.map((id) => items.byId[id]),
    [items.allIds, items.byId],
  );

  const handleSort = useCallback(() => {
    sortItems(sortDirection);
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, [sortDirection, sortItems]);

  const handleEditClick = useCallback((item: LegendItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  }, []);

  const handleModalOk = useCallback(() => {
    if (editingItem) {
      updateItem(editingItem.id, {
        name: editingItem.name,
        min: editingItem.min,
        max: editingItem.max,
        color: editingItem.color,
      });
    }
    setIsModalOpen(false);
    setEditingItem(null);
  }, [editingItem, updateItem]);

  const handleModalCancel = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
  }, []);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) {
        reorderItems(draggedIndex, index);
        setDraggedIndex(index);
      }
    },
    [draggedIndex, reorderItems],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleAddItem = useCallback(() => {
    addItem({ name: 'New', min: 0, max: 100, color: '#6B7280' });
  }, [addItem]);

  return (
    <Flex vertical gap="middle">
      <Flex align="center" justify="space-between">
        <Flex align="center" gap="small">
          <Typography.Text className="text-base text-gray-500">◐</Typography.Text>
          <Typography.Title level={3} className="text-primary text-base font-semibold">
            Legend Configuration
          </Typography.Title>
        </Flex>
        <Flex gap={4}>
          <Tooltip title={sortDirection === 'asc' ? 'Sort Ascending' : 'Sort Descending'}>
            <Button
              type="text"
              icon={
                sortDirection === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />
              }
              size="small"
              onClick={handleSort}
              className="text-gray-500"
            />
          </Tooltip>
        </Flex>
      </Flex>

      <Flex vertical gap="small">
        {/* Header */}
        <div className="gap-xs px-xs grid grid-cols-[20px_1fr_52px_52px_32px_20px] items-center text-xs font-medium text-gray-500">
          <Typography.Text />
          <Typography.Text>Name</Typography.Text>
          <Typography.Text>Min</Typography.Text>
          <Typography.Text>Max</Typography.Text>
          <Typography.Text>Color</Typography.Text>
          <Typography.Text />
        </div>

        {/* Legend Items */}
        {legendItems.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`gap-xs p-xs grid grid-cols-[20px_1fr_52px_52px_32px_20px] items-center rounded-md border border-gray-200 bg-white transition-opacity ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
          >
            <HolderOutlined className="cursor-grab text-gray-400 active:cursor-grabbing" />
            <button
              type="button"
              className="flex cursor-pointer items-center gap-1 overflow-hidden text-left"
              onClick={() => handleEditClick(item)}
            >
              <Typography.Text className="truncate text-sm">{item.name}</Typography.Text>
              <EditOutlined className="shrink-0 text-xs text-gray-400" />
            </button>
            <InputNumber
              value={item.min}
              onChange={(value) => updateItem(item.id, { min: value ?? 0 })}
              size="small"
              min={0}
              controls={false}
              className="w-full"
            />
            <InputNumber
              value={item.max}
              onChange={(value) => updateItem(item.id, { max: value ?? 0 })}
              size="small"
              min={0}
              controls={false}
              className="w-full"
            />
            <ColorPicker
              value={item.color}
              onChange={(color) => updateItem(item.id, { color: color.toHexString() })}
              size="small"
            />
            <Tooltip title="Remove">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                danger
                onClick={() => removeItem(item.id)}
                disabled={legendItems.length <= 1}
                className="p-0!"
              />
            </Tooltip>
          </div>
        ))}
      </Flex>

      <Button type="dashed" icon={<PlusOutlined />} block onClick={handleAddItem}>
        Add Level
      </Button>

      {/* Edit Modal */}
      {isModalOpen && (
        <Suspense fallback={<Spin />}>
          <EditLegendItemModal
            open={isModalOpen}
            editingItem={editingItem}
            onOk={handleModalOk}
            onCancel={handleModalCancel}
            onItemChange={setEditingItem}
          />
        </Suspense>
      )}
    </Flex>
  );
};

export default LegendConfigPanel;
