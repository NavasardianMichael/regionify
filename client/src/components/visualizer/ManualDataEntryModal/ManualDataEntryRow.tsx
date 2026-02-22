import { memo } from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Input, InputNumber, Typography } from 'antd';
import type { DataRow } from '@/helpers/manualDataEntryHelpers';

type ManualDataEntryRowProps = {
  row: DataRow;
  index: number;
  isTimelineMode: boolean;
  gridCols: string;
  onLabelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange: (rowKey: string, value: number | null) => void;
  onTimePeriodChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (e: React.MouseEvent<HTMLElement>) => void;
  canRemove: boolean;
};

export const ManualDataEntryRow = memo<ManualDataEntryRowProps>(function ManualDataEntryRow({
  row,
  index,
  isTimelineMode,
  gridCols,
  onLabelChange,
  onValueChange,
  onTimePeriodChange,
  onRemove,
  canRemove,
}) {
  return (
    <div key={row.key} data-rowkey={row.key} className={`gap-sm grid ${gridCols} items-center`}>
      <Typography.Text className="text-center text-sm text-gray-500">{index + 1}</Typography.Text>
      <Input
        value={row.id}
        data-rowkey={row.key}
        readOnly
        placeholder="Region ID"
        className="bg-gray-50"
      />
      <Input value={row.label} data-rowkey={row.key} onChange={onLabelChange} placeholder="Label" />
      <InputNumber
        value={row.value}
        onChange={(value: number | null) => onValueChange(row.key, value)}
        min={0}
        className="w-full"
      />
      {isTimelineMode && (
        <Input
          value={row.timePeriod ?? ''}
          data-rowkey={row.key}
          onChange={onTimePeriodChange}
          placeholder="e.g. 2020"
        />
      )}
      <Button
        type="text"
        icon={<DeleteOutlined />}
        danger
        data-rowkey={row.key}
        onClick={onRemove}
        disabled={!canRemove}
      />
    </div>
  );
});
