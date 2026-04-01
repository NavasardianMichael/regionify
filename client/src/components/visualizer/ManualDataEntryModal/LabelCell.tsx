import { type ChangeEvent, type KeyboardEvent, memo, useCallback, useRef, useState } from 'react';
import { Input } from 'antd';

type LabelCellProps = {
  rowKey: string;
  label: string;
  placeholder: string;
  onCommit: (rowKey: string, nextLabel: string) => void;
  readOnly?: boolean;
};

/**
 * Local draft while typing; commits to row state only on blur or Enter so table/filter/sort
 * updates never run mid-typing (avoids focus loss from Ant Table re-renders).
 */
export const LabelCell = memo(function LabelCell({
  rowKey,
  label,
  placeholder,
  onCommit,
  readOnly = false,
}: LabelCellProps) {
  const [draft, setDraft] = useState(label);
  const draftRef = useRef(label);

  const commitIfChanged = useCallback(() => {
    const v = draftRef.current;
    if (v !== label) {
      onCommit(rowKey, v);
    }
  }, [rowKey, label, onCommit]);

  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
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
    return (
      <Input
        value={label}
        data-rowkey={rowKey}
        disabled
        placeholder={placeholder}
        className="w-full min-w-0"
      />
    );
  }

  return (
    <Input
      value={draft}
      data-rowkey={rowKey}
      onChange={onChange}
      onBlur={handleBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
    />
  );
});
