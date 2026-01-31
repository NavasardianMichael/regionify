import { type FC, lazy, Suspense, useCallback, useMemo, useState } from 'react';
import {
  BarChartOutlined,
  DeleteOutlined,
  EditOutlined,
  HolderOutlined,
  PlusOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import { Button, ColorPicker, Flex, Input, InputNumber, Tooltip, Typography } from 'antd';
import {
  selectAddItem,
  selectLegendItems,
  selectRemoveItem,
  selectReorderItems,
  selectSetItems,
  selectSortItems,
  selectUpdateItem,
} from '@/store/legendData/selectors';
import { useLegendDataStore } from '@/store/legendData/store';
import type { LegendItem } from '@/store/legendData/types';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const EditLegendModal = lazy(() => import('./EditLegendModal'));

// Grid column template for consistent sizing
const GRID_COLS = 'grid-cols-[24px_minmax(80px,1fr)_60px_60px_36px_32px]';

const LegendConfigPanel: FC = () => {
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const items = useLegendDataStore(selectLegendItems);
  const addItem = useLegendDataStore(selectAddItem);
  const updateItem = useLegendDataStore(selectUpdateItem);
  const removeItem = useLegendDataStore(selectRemoveItem);
  const sortItems = useLegendDataStore(selectSortItems);
  const setItems = useLegendDataStore(selectSetItems);
  const reorderItems = useLegendDataStore(selectReorderItems);

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

  const handleRemoveLegendRange = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const id = e.currentTarget.dataset.id;
      if (id) {
        removeItem(id);
      }
    },
    [removeItem],
  );

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const index = e.currentTarget.dataset.index;
    if (index !== undefined) {
      setDraggedIndex(parseInt(index, 10));
    }
  }, []);

  const handleDragOver = useCallback(
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

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const id = e.currentTarget.dataset.id;
      if (id) {
        updateItem(id, { name: e.target.value });
      }
    },
    [updateItem],
  );

  return (
    <Flex vertical gap="middle">
      <Flex align="center" justify="space-between">
        <SectionTitle IconComponent={BarChartOutlined}>Legend Configuration</SectionTitle>
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
          <Tooltip title="Expand to Edit">
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

      {/* Legend Items */}
      <Flex vertical gap="small">
        {/* Header Row */}
        <div className={`grid ${GRID_COLS} gap-2 text-xs font-medium text-gray-500`}>
          <span />
          <Typography.Text className="text-xs text-gray-500">Name</Typography.Text>
          <Typography.Text className="text-xs text-gray-500">Min</Typography.Text>
          <Typography.Text className="text-xs text-gray-500">Max</Typography.Text>
          <Typography.Text className="text-xs text-gray-500">Color</Typography.Text>
          <span />
        </div>
        <Flex vertical>
          {legendItems.map((item, index) => (
            <div
              key={item.id}
              data-index={index}
              draggable
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              className={`grid ${GRID_COLS} items-center gap-2 rounded-md border border-none py-0.5 transition-opacity ${
                draggedIndex === index ? 'opacity-10' : ''
              }`}
            >
              <HolderOutlined className="cursor-grab text-gray-400 active:cursor-grabbing" />
              <Input
                value={item.name}
                data-id={item.id}
                onChange={handleNameChange}
                placeholder="Name"
                size="small"
                className="min-w-0"
              />
              <InputNumber
                value={item.min}
                onChange={(val) => updateItem(item.id, { min: val ?? 0 })}
                size="small"
                min={0}
                controls={false}
                className="box-border w-full!"
              />
              <InputNumber
                value={item.max}
                onChange={(val) => updateItem(item.id, { max: val ?? 0 })}
                size="small"
                min={0}
                controls={false}
                className="box-border w-full!"
              />
              <ColorPicker
                value={item.color}
                onChangeComplete={(color) => updateItem(item.id, { color: color.toHexString() })}
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
      </Flex>

      <Tooltip title="Add Range">
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          size="small"
          onClick={handleAddLegendRange}
          className="w-full text-gray-500"
        />
      </Tooltip>

      {/* Edit Modal */}
      <Suspense fallback={null}>
        <EditLegendModal
          open={isModalOpen}
          items={legendItems}
          onSave={handleSaveFromModal}
          onCancel={handleCloseModal}
        />
      </Suspense>
    </Flex>
  );
};

export default LegendConfigPanel;
