import { memo, type MouseEvent } from 'react';
import { DeleteOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Flex, Tooltip } from 'antd';

type ActionsCellProps = {
  rowKey: string;
  hidden: boolean;
  showOnChartLabel: string;
  hideFromChartLabel: string;
  deleteRowLabel: string;
  onActionClick: (e: MouseEvent<HTMLButtonElement>) => void;
  readOnly?: boolean;
};

export const ActionsCell = memo(function ActionsCell({
  rowKey,
  hidden,
  showOnChartLabel,
  hideFromChartLabel,
  deleteRowLabel,
  onActionClick,
  readOnly = false,
}: ActionsCellProps) {
  if (readOnly) {
    return null;
  }

  return (
    <Flex gap={0} justify="flex-end" wrap="nowrap" className="min-w-0">
      <Tooltip
        title={hidden ? showOnChartLabel : hideFromChartLabel}
        data-i18n-key="visualizer.manualEntry.showOnChart"
      >
        <Button
          type="text"
          size="small"
          icon={hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          data-rowkey={rowKey}
          data-action="toggleChart"
          onClick={onActionClick}
          aria-label={hidden ? showOnChartLabel : hideFromChartLabel}
          className={hidden ? 'text-gray-400' : 'text-gray-600'}
          data-i18n-key="visualizer.manualEntry.showOnChart"
        />
      </Tooltip>
      <Tooltip title={deleteRowLabel} data-i18n-key="visualizer.manualEntry.deleteRow">
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          data-rowkey={rowKey}
          data-action="delete"
          onClick={onActionClick}
          aria-label={deleteRowLabel}
          data-i18n-key="visualizer.manualEntry.deleteRow"
        />
      </Tooltip>
    </Flex>
  );
});
