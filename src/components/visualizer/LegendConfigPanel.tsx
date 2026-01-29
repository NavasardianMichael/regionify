import { type FC, useCallback, useMemo, useState } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  HolderOutlined,
  PlusOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import { Button, ColorPicker, Input, InputNumber, Modal, Tooltip } from 'antd';
import { useLegendDataStore } from '@/store/legendData/store';
import type { LegendItem } from '@/store/legendData/types';

export const LegendConfigPanel: FC = () => {
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
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <div className="gap-sm flex items-center">
          <span className="text-base text-gray-500">◐</span>
          <h3 className="text-primary text-base font-semibold">Legend Configuration</h3>
        </div>
        <div className="gap-xs flex">
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
        </div>
      </div>

      <div className="space-y-xs">
        {/* Header */}
        <div className="gap-xs px-xs grid grid-cols-[20px_1fr_52px_52px_32px_20px] items-center text-xs font-medium text-gray-500">
          <span />
          <span>Name</span>
          <span>Min</span>
          <span>Max</span>
          <span>Color</span>
          <span />
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
              <span className="truncate text-sm">{item.name}</span>
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
      </div>

      <Button type="dashed" icon={<PlusOutlined />} block onClick={handleAddItem}>
        Add Level
      </Button>

      {/* Edit Modal */}
      <Modal
        title="Edit Legend Item"
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        destroyOnHidden
      >
        {editingItem && (
          <div className="space-y-md py-md">
            <div className="space-y-xs">
              <span className="text-sm font-medium text-gray-700">Name</span>
              <Input
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                placeholder="Legend name"
              />
            </div>
            <div className="gap-md grid grid-cols-2">
              <div className="space-y-xs">
                <span className="text-sm font-medium text-gray-700">Min Value</span>
                <InputNumber
                  value={editingItem.min}
                  onChange={(value) => setEditingItem({ ...editingItem, min: value ?? 0 })}
                  min={0}
                  className="w-full"
                />
              </div>
              <div className="space-y-xs">
                <span className="text-sm font-medium text-gray-700">Max Value</span>
                <InputNumber
                  value={editingItem.max}
                  onChange={(value) => setEditingItem({ ...editingItem, max: value ?? 0 })}
                  min={0}
                  className="w-full"
                />
              </div>
            </div>
            <div className="space-y-xs">
              <span className="text-sm font-medium text-gray-700">Color</span>
              <ColorPicker
                value={editingItem.color}
                onChange={(color) => setEditingItem({ ...editingItem, color: color.toHexString() })}
                showText
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
