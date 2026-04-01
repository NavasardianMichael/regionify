import { memo, useCallback } from 'react';
import { InputNumber } from 'antd';

type ValueCellProps = {
  rowKey: string;
  value: number;
  onCommit: (rowKey: string, nextValue: number | null) => void;
  readOnly?: boolean;
};

export const ValueCell = memo(function ValueCell({
  rowKey,
  value,
  onCommit,
  readOnly = false,
}: ValueCellProps) {
  const onChange = useCallback(
    (v: number | null) => {
      onCommit(rowKey, v);
    },
    [rowKey, onCommit],
  );

  return (
    <InputNumber
      value={value}
      onChange={onChange}
      min={0}
      disabled={readOnly}
      className="w-full! max-w-full min-w-0"
    />
  );
});
