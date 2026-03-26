import { memo, useCallback } from 'react';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Input, InputNumber, Tooltip, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import type { DataRow } from '@/helpers/manualDataEntryHelpers';

type ManualDataEntryRowProps = {
  row: DataRow;
  index: number;
  isTimelineMode: boolean;
  gridCols: string;
  placeholderRegionId: string;
  placeholderLabel: string;
  onLabelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange: (rowKey: string, value: number | null) => void;
  onToggleChartVisibility: (e: React.MouseEvent<HTMLElement>) => void;
};

export const ManualDataEntryRow = memo<ManualDataEntryRowProps>(function ManualDataEntryRow({
  row,
  index,
  isTimelineMode,
  gridCols,
  placeholderRegionId,
  placeholderLabel,
  onLabelChange,
  onValueChange,
  onToggleChartVisibility,
}) {
  const { t } = useTypedTranslation();
  const hidden = row.hidden === true;
  const timeValue =
    row.timePeriod != null && row.timePeriod !== '' && !Number.isNaN(Number(row.timePeriod))
      ? Number(row.timePeriod)
      : null;

  const handleNumberChange = useCallback(
    (value: number | null) => {
      onValueChange(row.key, value);
    },
    [onValueChange, row.key],
  );

  return (
    <div data-rowkey={row.key} className={`gap-sm grid ${gridCols} items-center`}>
      <Typography.Text className="text-center text-sm text-gray-500">{index + 1}</Typography.Text>
      <Input
        value={row.id}
        data-rowkey={row.key}
        disabled
        placeholder={placeholderRegionId}
        className="bg-gray-50"
      />
      <Input
        value={row.label}
        data-rowkey={row.key}
        onChange={onLabelChange}
        placeholder={placeholderLabel}
      />
      <InputNumber value={row.value} onChange={handleNumberChange} min={0} className="w-full" />
      {isTimelineMode && (
        <InputNumber value={timeValue} disabled controls={false} className="w-full" />
      )}
      <Tooltip
        title={
          hidden
            ? t('visualizer.manualEntry.showOnChart')
            : t('visualizer.manualEntry.hideFromChart')
        }
      >
        <Button
          type="text"
          icon={hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          data-rowkey={row.key}
          onClick={onToggleChartVisibility}
          aria-label={
            hidden
              ? t('visualizer.manualEntry.showOnChart')
              : t('visualizer.manualEntry.hideFromChart')
          }
          className={hidden ? 'text-gray-400' : 'text-gray-600'}
        />
      </Tooltip>
    </div>
  );
});
