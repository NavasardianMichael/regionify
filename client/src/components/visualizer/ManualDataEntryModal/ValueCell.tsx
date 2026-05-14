import { type KeyboardEvent, memo, useCallback, useRef, useState } from 'react';
import { InputNumber } from 'antd';

type ValueCellProps = {
  rowKey: string;
  value: number;
  onCommit: (rowKey: string, nextValue: number | null) => void;
  readOnly?: boolean;
};

/**
 * Local draft while typing; commits to row state only on blur or Enter so table/filter/sort
 * updates never run mid-typing (avoids focus loss from Ant Table re-renders).
 */
export const ValueCell = memo(function ValueCell({
  rowKey,
  value,
  onCommit,
  readOnly = false,
}: ValueCellProps) {
  const [draft, setDraft] = useState<number | null>(value);
  const draftRef = useRef<number | null>(value);

  const commitIfChanged = useCallback(() => {
    const v = draftRef.current;
    if (v !== value) {
      onCommit(rowKey, v);
    }
  }, [rowKey, value, onCommit]);

  const onChange = useCallback((v: number | null) => {
    draftRef.current = v;
    setDraft(v);
  }, []);

  const handleBlur = useCallback(() => {
    commitIfChanged();
  }, [commitIfChanged]);

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }, []);

  if (readOnly) {
    return <InputNumber value={value} disabled min={0} className="w-full! max-w-full min-w-0" />;
  }

  return (
    <InputNumber
      value={draft}
      onChange={onChange}
      onBlur={handleBlur}
      onKeyDown={onKeyDown}
      min={0}
      className="w-full! max-w-full min-w-0"
    />
  );
});
