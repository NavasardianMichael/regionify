import {
  type ChangeEvent,
  type FC,
  type KeyboardEvent,
  startTransition,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { SearchOutlined } from '@ant-design/icons';
import { Input, type InputRef } from 'antd';
import { type ColumnFilterKey, type ColumnFilters } from './types';

type TextFilterBodyProps = {
  columnKey: ColumnFilterKey;
  visible: boolean;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFilters>>;
  placeholder: string;
  filtersRef: React.MutableRefObject<ColumnFilters>;
};

/**
 * Stable filter body: local input value while the dropdown stays open so the Table column's
 * `filterDropdown` reference does not change every keystroke.
 */
export const TextFilterBody: FC<TextFilterBodyProps> = ({
  columnKey,
  visible,
  setColumnFilters,
  placeholder,
  filtersRef,
}) => {
  const inputRef = useRef<InputRef>(null);
  const [text, setText] = useState('');

  useLayoutEffect(() => {
    if (!visible) return;
    setText(filtersRef.current[columnKey]);
  }, [visible, columnKey, filtersRef]);

  useLayoutEffect(() => {
    if (!visible) return;
    const focusInput = () => {
      const inst = inputRef.current;
      if (!inst) return;
      const el = inst.input;
      (el ?? inst).focus({ preventScroll: true });
      if (el && typeof el.setSelectionRange === 'function') {
        const len = el.value?.length ?? 0;
        el.setSelectionRange(len, len);
      }
    };
    focusInput();
    const t1 = window.setTimeout(focusInput, 0);
    const t2 = window.setTimeout(focusInput, 100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [visible]);

  const stopFilterKeyPropagation = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
  }, []);

  return (
    <div className="w-52 p-2">
      <Input
        ref={inputRef}
        allowClear
        variant="outlined"
        prefix={<SearchOutlined className="text-[rgba(0,0,0,0.45)]" />}
        placeholder={placeholder}
        value={text}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const v = e.target.value;
          setText(v);
          startTransition(() => {
            setColumnFilters((f) => ({ ...f, [columnKey]: v }));
          });
        }}
        onKeyDown={stopFilterKeyPropagation}
      />
    </div>
  );
};
