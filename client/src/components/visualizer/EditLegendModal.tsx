import { type FC, useCallback, useMemo, useState } from 'react';
import { PlusOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Tooltip, Typography } from 'antd';
import type { LegendItem } from '@/store/legendData/types';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { generateRandomId } from '@/helpers/common';
import { LegendItemRow } from '@/components/visualizer/LegendItemRow';

type ColorLike = { toHexString: () => string };

type Props = {
  open: boolean;
  items: LegendItem[];
  onSave: (items: LegendItem[]) => void;
  onCancel: () => void;
};

// Grid column template for consistent sizing
const GRID_COLS = 'grid-cols-[24px_minmax(120px,1fr)_100px_100px_36px_32px]';

// Normalized state shape for O(1) updates
type NormalizedItems = {
  byId: Record<string, LegendItem>;
  allIds: string[];
};

const normalizeItems = (items: LegendItem[]): NormalizedItems => ({
  byId: items.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<string, LegendItem>,
  ),
  allIds: items.map((item) => item.id),
});

const denormalizeItems = (normalized: NormalizedItems): LegendItem[] =>
  normalized.allIds.map((id) => normalized.byId[id]);

const EditLegendModal: FC<Props> = ({ open, items, onSave, onCancel }) => {
  const { t } = useTypedTranslation();
  const [normalizedItems, setNormalizedItems] = useState<NormalizedItems>(() =>
    normalizeItems(items),
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Derive list from normalized state
  const localItems = useMemo(() => denormalizeItems(normalizedItems), [normalizedItems]);

  // Reset local state when modal opens with fresh items
  const handleAfterOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setNormalizedItems(normalizeItems(items));
      }
    },
    [items],
  );

  const handleAddLegendRange = useCallback(() => {
    const newItem: LegendItem = {
      id: generateRandomId(),
      name: t('visualizer.newLegendRangeName'),
      min: 0,
      max: 100,
      color: '#6B7280',
    };
    setNormalizedItems((prev) => ({
      byId: { ...prev.byId, [newItem.id]: newItem },
      allIds: [...prev.allIds, newItem.id],
    }));
  }, [t]);

  // O(1) update handler - only updates the specific item in byId
  const handleUpdateItem = useCallback((id: string, updates: Partial<LegendItem>) => {
    setNormalizedItems((prev) => ({
      ...prev,
      byId: {
        ...prev.byId,
        [id]: { ...prev.byId[id], ...updates },
      },
    }));
  }, []);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const id = e.currentTarget.dataset.id;
      if (id) {
        handleUpdateItem(id, { name: e.target.value });
      }
    },
    [handleUpdateItem],
  );

  // Memoize handlers by id to avoid recreating on every render
  const itemHandlers = useMemo(() => {
    return normalizedItems.allIds.reduce(
      (acc, id) => {
        acc[id] = {
          onMinChange: (value: number | null) => handleUpdateItem(id, { min: value! }),
          onMaxChange: (value: number | null) => handleUpdateItem(id, { max: value! }),
          onColorChange: (color: ColorLike) => handleUpdateItem(id, { color: color.toHexString() }),
        };
        return acc;
      },
      {} as Record<
        string,
        {
          onMinChange: (value: number | null) => void;
          onMaxChange: (value: number | null) => void;
          onColorChange: (color: ColorLike) => void;
        }
      >,
    );
  }, [normalizedItems.allIds, handleUpdateItem]);

  const handleRemoveLegendRange = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const id = e.currentTarget.dataset.id;
    if (id) {
      setNormalizedItems((prev) => {
        const { [id]: _removed, ...restById } = prev.byId;
        return {
          byId: restById,
          allIds: prev.allIds.filter((itemId) => itemId !== id),
        };
      });
    }
  }, []);

  const handleSortLegendRanges = useCallback(() => {
    setNormalizedItems((prev) => {
      const sorted = [...prev.allIds].sort((a, b) =>
        sortDirection === 'asc'
          ? prev.byId[a].min - prev.byId[b].min
          : prev.byId[b].min - prev.byId[a].min,
      );
      return { ...prev, allIds: sorted };
    });
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, [sortDirection]);

  const handleReorderLegendRange = useCallback((fromIndex: number, toIndex: number) => {
    setNormalizedItems((prev) => {
      const newAllIds = [...prev.allIds];
      const [removed] = newAllIds.splice(fromIndex, 1);
      newAllIds.splice(toIndex, 0, removed);
      return { ...prev, allIds: newAllIds };
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
      title={t('visualizer.legendModal.title')}
      open={open}
      onCancel={onCancel}
      closable
      afterOpenChange={handleAfterOpenChange}
      footer={
        <Flex justify="end" gap="middle">
          <Button onClick={onCancel}>{t('nav.cancel')}</Button>
          <Button type="primary" onClick={handleSaveLegendRanges}>
            {t('visualizer.done')}
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
          <Tooltip
            title={
              sortDirection === 'asc'
                ? t('visualizer.legendModal.sortAscending')
                : t('visualizer.legendModal.sortDescending')
            }
          >
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
          <Tooltip title={t('visualizer.legendModal.addRange')}>
            <Button
              type="text"
              icon={<PlusOutlined />}
              size="small"
              onClick={handleAddLegendRange}
              className="text-gray-500"
            />
          </Tooltip>
        </Flex>

        {/* Header Row */}
        <div className={`grid ${GRID_COLS} gap-2 text-xs font-medium text-gray-500`}>
          <span />
          <Typography.Text className="text-xs text-gray-500">
            {t('visualizer.legendColumns.name')}
          </Typography.Text>
          <Typography.Text className="text-xs text-gray-500">
            {t('visualizer.legendColumns.minLong')}
          </Typography.Text>
          <Typography.Text className="text-xs text-gray-500">
            {t('visualizer.legendColumns.maxLong')}
          </Typography.Text>
          <Typography.Text className="text-xs text-gray-500">
            {t('visualizer.legendColumns.color')}
          </Typography.Text>
          <span />
        </div>

        {/* Legend Items */}
        <Flex vertical className="max-h-4/5 overflow-y-auto">
          {localItems.map((item, index) => (
            <LegendItemRow
              key={item.id}
              item={item}
              index={index}
              isDragged={draggedIndex === index}
              isRemoveDisabled={!canDelete}
              gridCols={GRID_COLS}
              onDragStart={handleDragStartLegendRange}
              onDragOver={handleDragOverLegendRange}
              onDragEnd={handleDragEndLegendRange}
              onNameChange={handleNameChange}
              onMinChange={itemHandlers[item.id]?.onMinChange ?? (() => {})}
              onMaxChange={itemHandlers[item.id]?.onMaxChange ?? (() => {})}
              onColorChange={itemHandlers[item.id]?.onColorChange ?? (() => {})}
              onRemove={handleRemoveLegendRange}
            />
          ))}
        </Flex>

        {/* Add Range Button after list */}
        <Tooltip title={t('visualizer.legendModal.addRange')}>
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
