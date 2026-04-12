import { type FC, useCallback, useMemo, useState } from 'react';
import { SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { Modal as AntModal } from 'antd';
import type { LegendItem } from '@/store/legendData/types';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { generateRandomId } from '@/helpers/common';
import { Body } from './Body';
import { Footer } from './Footer';

type ColorLike = { toHexString: () => string };

type Props = {
  open: boolean;
  items: LegendItem[];
  onSave: (items: LegendItem[]) => void;
  onCancel: () => void;
};

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

export const EditLegendModal: FC<Props> = ({ open, items, onSave, onCancel }) => {
  const { t } = useTypedTranslation();
  const [normalizedItems, setNormalizedItems] = useState<NormalizedItems>(() =>
    normalizeItems(items),
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const localItems = useMemo(() => denormalizeItems(normalizedItems), [normalizedItems]);

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

  const handleUpdateItem = useCallback((id: string, updates: Partial<LegendItem>) => {
    setNormalizedItems((prev) => ({
      ...prev,
      byId: {
        ...prev.byId,
        [id]: { ...prev.byId[id], ...updates },
      },
    }));
  }, []);

  const handleLegendNameChange = useCallback(
    (id: string, name: string) => {
      handleUpdateItem(id, { name });
    },
    [handleUpdateItem],
  );

  const handleLegendMinChange = useCallback(
    (id: string, value: number | null) => {
      handleUpdateItem(id, { min: value ?? 0 });
    },
    [handleUpdateItem],
  );

  const handleLegendMaxChange = useCallback(
    (id: string, value: number | null) => {
      handleUpdateItem(id, { max: value ?? 0 });
    },
    [handleUpdateItem],
  );

  const handleLegendColorChange = useCallback(
    (id: string, color: ColorLike) => {
      handleUpdateItem(id, { color: color.toHexString() });
    },
    [handleUpdateItem],
  );

  const sortTooltipTitle = useMemo(
    () =>
      sortDirection === 'asc'
        ? t('visualizer.legendModal.sortAscending')
        : t('visualizer.legendModal.sortDescending'),
    [sortDirection, t],
  );

  const sortLegendIcon = useMemo(
    () => (sortDirection === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />),
    [sortDirection],
  );

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
    <AntModal
      title={t('visualizer.legendModal.title')}
      open={open}
      onCancel={onCancel}
      closable
      afterOpenChange={handleAfterOpenChange}
      footer={
        <Footer
          cancelLabel={t('nav.cancel')}
          doneLabel={t('visualizer.done')}
          onCancel={onCancel}
          onSave={handleSaveLegendRanges}
        />
      }
      centered
      className="w-4/5! lg:w-2/3!"
      destroyOnHidden
      data-i18n-key="visualizer.legendModal.title"
    >
      <Body
        localItems={localItems}
        sortTooltipTitle={sortTooltipTitle}
        sortLegendIcon={sortLegendIcon}
        canDelete={canDelete}
        draggedIndex={draggedIndex}
        onSort={handleSortLegendRanges}
        onAddRange={handleAddLegendRange}
        onDragStart={handleDragStartLegendRange}
        onDragOver={handleDragOverLegendRange}
        onDragEnd={handleDragEndLegendRange}
        onNameChange={handleLegendNameChange}
        onMinChange={handleLegendMinChange}
        onMaxChange={handleLegendMaxChange}
        onColorChange={handleLegendColorChange}
        onRemove={handleRemoveLegendRange}
      />
    </AntModal>
  );
};
