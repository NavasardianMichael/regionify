import { memo, useCallback } from 'react';
import { DeleteOutlined, HolderOutlined } from '@ant-design/icons';
import { Button, ColorPicker, Input, InputNumber, Tooltip } from 'antd';
import type { LegendItem } from '@/store/legendData/types';

const DEFAULT_GRID_COLS = 'grid-cols-[24px_minmax(80px,1fr)_60px_60px_36px_32px]';

type ColorLike = { toHexString: () => string };

type LegendItemRowProps = {
  item: LegendItem;
  index: number;
  isDragged: boolean;
  isRemoveDisabled: boolean;
  gridCols?: string;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onNameChange: (id: string, name: string) => void;
  onMinChange: (id: string, value: number | null) => void;
  onMaxChange: (id: string, value: number | null) => void;
  onColorChange: (id: string, color: ColorLike) => void;
  onRemove: (e: React.MouseEvent<HTMLElement>) => void;
};

export const LegendItemRow = memo<LegendItemRowProps>(function LegendItemRow({
  item,
  index,
  isDragged,
  isRemoveDisabled,
  gridCols = DEFAULT_GRID_COLS,
  onDragStart,
  onDragOver,
  onDragEnd,
  onNameChange,
  onMinChange,
  onMaxChange,
  onColorChange,
  onRemove,
}) {
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const id = e.currentTarget.dataset.id;
      if (id) onNameChange(id, e.target.value);
    },
    [onNameChange],
  );

  const handleMinChange = useCallback(
    (v: number | null) => onMinChange(item.id, v),
    [item.id, onMinChange],
  );

  const handleMaxChange = useCallback(
    (v: number | null) => onMaxChange(item.id, v),
    [item.id, onMaxChange],
  );

  const handleColorChange = useCallback(
    (color: ColorLike) => onColorChange(item.id, color),
    [item.id, onColorChange],
  );

  return (
    <div
      data-index={index}
      data-id={item.id}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`grid ${gridCols} items-center gap-2 rounded-md border border-none py-0.5 transition-opacity ${
        isDragged ? 'opacity-10' : ''
      }`}
    >
      <HolderOutlined
        className="cursor-grab text-gray-400 active:cursor-grabbing"
        aria-hidden="true"
      />
      <Input
        value={item.name}
        data-id={item.id}
        onChange={handleNameChange}
        placeholder="Name"
        size="small"
        className="min-w-0"
        aria-label="Legend item name"
      />
      <InputNumber
        value={item.min}
        onChange={handleMinChange}
        size="small"
        min={0}
        controls={false}
        className="box-border w-full!"
        aria-label="Minimum value"
      />
      <InputNumber
        value={item.max}
        onChange={handleMaxChange}
        size="small"
        min={0}
        controls={false}
        className="box-border w-full!"
        aria-label="Maximum value"
      />
      <ColorPicker value={item.color} onChangeComplete={handleColorChange} size="small" />
      <Tooltip title="Remove">
        <Button
          type="text"
          icon={<DeleteOutlined />}
          size="small"
          danger
          data-id={item.id}
          onClick={onRemove}
          disabled={isRemoveDisabled}
          aria-label="Remove legend item"
        />
      </Tooltip>
    </div>
  );
});
