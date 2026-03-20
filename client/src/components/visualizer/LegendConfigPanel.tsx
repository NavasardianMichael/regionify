import { type FC, lazy, Suspense, useCallback, useMemo, useState } from 'react';
import {
  BarChartOutlined,
  EditOutlined,
  PlusOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import { Button, Flex, Tooltip, Typography } from 'antd';
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
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { LegendItemRow } from '@/components/visualizer/LegendItemRow';
import { SectionTitle } from '@/components/visualizer/SectionTitle';

const EditLegendModal = lazy(() => import('./EditLegendModal'));

const GRID_COLS = 'grid-cols-[24px_minmax(80px,1fr)_60px_60px_36px_32px]';

const LegendConfigPanel: FC = () => {
  const { t } = useTypedTranslation();
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

  return (
    <Flex vertical gap="middle">
      <Flex align="center" justify="space-between">
        <SectionTitle IconComponent={BarChartOutlined}>
          {t('visualizer.legendConfig.sectionTitle')}
        </SectionTitle>
        <Flex gap={4}>
          <Tooltip
            title={
              sortDirection === 'asc'
                ? t('visualizer.legendConfig.sortAscending')
                : t('visualizer.legendConfig.sortDescending')
            }
          >
            <Button
              type="text"
              icon={
                sortDirection === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />
              }
              size="small"
              onClick={handleSort}
              className="text-gray-500"
              aria-label={
                sortDirection === 'asc'
                  ? t('visualizer.legendConfig.sortAscending')
                  : t('visualizer.legendConfig.sortDescending')
              }
            />
          </Tooltip>
          <Tooltip title={t('visualizer.legendConfig.expandEdit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={handleOpenModal}
              className="text-gray-500"
              aria-label={t('visualizer.legendConfig.expandEditAria')}
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
            <LegendItemRow
              key={item.id}
              item={item}
              index={index}
              isDragged={draggedIndex === index}
              isRemoveDisabled={legendItems.length <= 1}
              gridCols={GRID_COLS}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onNameChange={(e) => {
                const id = e.currentTarget.dataset.id;
                if (id) updateItem(id, { name: e.target.value });
              }}
              onMinChange={(v) => updateItem(item.id, { min: v ?? 0 })}
              onMaxChange={(v) => updateItem(item.id, { max: v ?? 0 })}
              onColorChange={(c) => updateItem(item.id, { color: c.toHexString() })}
              onRemove={handleRemoveLegendRange}
            />
          ))}
        </Flex>
      </Flex>

      <Tooltip title={t('visualizer.legendConfig.addRange')}>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          size="small"
          onClick={handleAddLegendRange}
          className="w-full text-gray-500"
          aria-label={t('visualizer.legendConfig.addRangeAria')}
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
