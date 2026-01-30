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
import {
  selectAddItem,
  selectLegendItems,
  selectRemoveItem,
  selectReorderItems,
  selectSetItems,
  selectSortItems,
  selectUpdateItem,
  useLegendDataStore,
} from '@/store/legendData/store';
import type { LegendItem } from '@/store/legendData/types';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const EditLegendModal = lazy(() => import('./EditLegendModal'));

const LegendConfigPanel: FC = () => {
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const items = useLegendDataStore(selectLegendItems);
  const addItem = useLegendDataStore(selectAddItem);
  const updateItem = useLegendDataStore(selectUpdateItem);
  const removeItem = useLegendDataStore(selectRemoveItem);
  const reorderItems = useLegendDataStore(selectReorderItems);
  const sortItems = useLegendDataStore(selectSortItems);
  const setItems = useLegendDataStore(selectSetItems);

  const legendItems = useMemo(
    () => items.allIds.map((id) => items.byId[id]),
    [items.allIds, items.byId],
  );

  const handleSort = useCallback(() => {
    sortItems(sortDirection);
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, [sortDirection, sortItems]);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSaveFromModal = useCallback(
    (newItems: LegendItem[]) => {
      setItems(newItems);
      setIsModalOpen(false);
    },
    [setItems],
  );

  const handleAddLegendRange = useCallback(() => {
    addItem({ name: 'New Range', min: 0, max: 100, color: '#6B7280' });
  }, [addItem]);

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
          reorderItems(draggedIndex, targetIndex);
          setDraggedIndex(targetIndex);
        }
      }
    },
    [draggedIndex, reorderItems],
  );

  const handleDragEndLegendRange = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleRemoveLegendRange = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const id = e.currentTarget.dataset.id;
      if (id) {
        removeItem(id);
      }
    },
    [removeItem],
  );

  return (
    <Flex vertical gap="middle">
      <Flex align="center" justify="space-between">
        <SectionTitle IconComponent={HolderOutlined}>Legend Configuration</SectionTitle>
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
          <Tooltip title="Edit All">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={handleOpenModal}
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
            data-id={item.id}
            data-index={index}
            draggable
            onDragStart={handleDragStartLegendRange}
            onDragOver={handleDragOverLegendRange}
            onDragEnd={handleDragEndLegendRange}
            className={`gap-xs p-xs grid grid-cols-[20px_1fr_52px_52px_32px_20px] items-center bg-white transition-opacity ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
          >
            <HolderOutlined className="cursor-grab text-gray-400 active:cursor-grabbing" />
            <Typography.Text className="truncate text-sm">{item.name}</Typography.Text>
            <InputNumber
              value={item.min}
              onChange={(value) => updateItem(item.id, { min: value ?? 0 })}
              size="small"
              min={0}
              controls={false}
            />
            <InputNumber
              value={item.max}
              onChange={(value) => updateItem(item.id, { max: value ?? 0 })}
              size="small"
              min={0}
              controls={false}
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
                data-id={item.id}
                onClick={handleRemoveLegendRange}
                disabled={legendItems.length <= 1}
              />
            </Tooltip>
          </div>
        ))}
      </Flex>

      <Flex justify="center">
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

      {/* Edit Modal */}
      {isModalOpen && (
        <Suspense fallback={<Spin />}>
          <EditLegendModal
            open={isModalOpen}
            items={legendItems}
            onSave={handleSaveFromModal}
            onCancel={handleCloseModal}
          />
        </Suspense>
      )}
    </Flex>
  );
};

export default LegendConfigPanel;
