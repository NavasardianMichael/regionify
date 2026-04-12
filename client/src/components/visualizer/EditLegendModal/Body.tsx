import { type FC, type ReactElement } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Tooltip, Typography } from 'antd';
import type { LegendItem } from '@/store/legendData/types';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { LegendItemRow } from '@/components/visualizer/LegendItemRow';
import { EDIT_LEGEND_GRID_COLS } from './constants';

type BodyProps = {
  localItems: LegendItem[];
  sortTooltipTitle: string;
  sortLegendIcon: ReactElement;
  canDelete: boolean;
  draggedIndex: number | null;
  onSort: () => void;
  onAddRange: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onNameChange: (id: string, name: string) => void;
  onMinChange: (id: string, value: number | null) => void;
  onMaxChange: (id: string, value: number | null) => void;
  onColorChange: (id: string, color: { toHexString: () => string }) => void;
  onRemove: (e: React.MouseEvent<HTMLElement>) => void;
};

export const Body: FC<BodyProps> = ({
  localItems,
  sortTooltipTitle,
  sortLegendIcon,
  canDelete,
  draggedIndex,
  onSort,
  onAddRange,
  onDragStart,
  onDragOver,
  onDragEnd,
  onNameChange,
  onMinChange,
  onMaxChange,
  onColorChange,
  onRemove,
}) => {
  const { t } = useTypedTranslation();
  const gridCols = EDIT_LEGEND_GRID_COLS;

  return (
    <Flex vertical gap="small" className="py-md">
      <Flex gap={4} justify="end">
        <Tooltip title={sortTooltipTitle}>
          <Button
            type="text"
            icon={sortLegendIcon}
            size="small"
            onClick={onSort}
            className="text-gray-500"
          />
        </Tooltip>
        <Tooltip
          title={t('visualizer.legendModal.addRange')}
          data-i18n-key="visualizer.legendModal.addRange"
        >
          <Button
            type="text"
            icon={<PlusOutlined />}
            size="small"
            onClick={onAddRange}
            className="text-gray-500"
          />
        </Tooltip>
      </Flex>

      <div className={`grid ${gridCols} gap-2 text-xs font-medium text-gray-500`}>
        <span />
        <Typography.Text
          className="text-xs text-gray-500"
          data-i18n-key="visualizer.legendColumns.name"
        >
          {t('visualizer.legendColumns.name')}
        </Typography.Text>
        <Typography.Text
          className="text-xs text-gray-500"
          data-i18n-key="visualizer.legendColumns.minLong"
        >
          {t('visualizer.legendColumns.minLong')}
        </Typography.Text>
        <Typography.Text
          className="text-xs text-gray-500"
          data-i18n-key="visualizer.legendColumns.maxLong"
        >
          {t('visualizer.legendColumns.maxLong')}
        </Typography.Text>
        <Typography.Text
          className="text-xs text-gray-500"
          data-i18n-key="visualizer.legendColumns.color"
        >
          {t('visualizer.legendColumns.color')}
        </Typography.Text>
        <span />
      </div>

      <Flex vertical className="max-h-4/5 overflow-y-auto">
        {localItems.map((item, index) => (
          <LegendItemRow
            key={item.id}
            item={item}
            index={index}
            isDragged={draggedIndex === index}
            isRemoveDisabled={!canDelete}
            gridCols={gridCols}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onNameChange={onNameChange}
            onMinChange={onMinChange}
            onMaxChange={onMaxChange}
            onColorChange={onColorChange}
            onRemove={onRemove}
          />
        ))}
      </Flex>

      <Tooltip
        title={t('visualizer.legendModal.addRange')}
        data-i18n-key="visualizer.legendModal.addRange"
      >
        <Button type="dashed" icon={<PlusOutlined />} onClick={onAddRange} className="w-full" />
      </Tooltip>
    </Flex>
  );
};
