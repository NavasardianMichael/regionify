/* eslint-disable react-refresh/only-export-components -- Table DnD helpers and sortable primitives live together */
import type React from 'react';
import { forwardRef, type ReactNode, useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { combineClassNames } from '@/helpers/common';

export const ROW_DND_PREFIX = 'row:';

export function rowDndId(key: string): string {
  return `${ROW_DND_PREFIX}${key}`;
}

export function parseRowDndId(id: string | number): string | null {
  const s = String(id);
  return s.startsWith(ROW_DND_PREFIX) ? s.slice(ROW_DND_PREFIX.length) : null;
}

type SortableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  children: ReactNode;
  'data-row-key'?: string;
};

export const SortableBodyRow = forwardRef<HTMLTableRowElement, SortableRowProps>(
  function SortableBodyRow(props, forwardedRef) {
    const { children, className, style: rowStyle, ...rest } = props;
    const rowKey = rest['data-row-key'];
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: rowKey != null ? rowDndId(rowKey) : '',
      disabled: rowKey == null,
    });

    const setRefs = (node: HTMLTableRowElement | null) => {
      setNodeRef(node);
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    const style: React.CSSProperties = {
      ...rowStyle,
      transform: rowKey != null ? CSS.Transform.toString(transform) : undefined,
      transition,
      ...(isDragging ? { position: 'relative', zIndex: 9 } : {}),
    };

    const mergedClassName = combineClassNames([
      className,
      rowKey != null ? 'cursor-grab active:cursor-grabbing [&_button]:cursor-pointer' : undefined,
    ]);

    return (
      <tr
        {...rest}
        ref={setRefs}
        style={style}
        className={mergedClassName}
        {...attributes}
        {...listeners}
      >
        {children}
      </tr>
    );
  },
);

type UseTableDndArgs = {
  rowKeysInOrder: string[];
  onRowReorder: (keysInNewOrder: string[]) => void;
};

export function useTableDnd({ rowKeysInOrder, onRowReorder }: UseTableDndArgs): {
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  rowSortableItems: string[];
} {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const rowSortableItems = useMemo(() => rowKeysInOrder.map((k) => rowDndId(k)), [rowKeysInOrder]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over == null || active.id === over.id) return;

    const activeStr = String(active.id);
    if (!activeStr.startsWith(ROW_DND_PREFIX)) return;

    const rowActive = parseRowDndId(active.id);
    const rowOver = parseRowDndId(over.id);
    if (rowActive && rowOver) {
      const oldIndex = rowKeysInOrder.indexOf(rowActive);
      const newIndex = rowKeysInOrder.indexOf(rowOver);
      if (oldIndex < 0 || newIndex < 0) return;
      onRowReorder(arrayMove(rowKeysInOrder, oldIndex, newIndex));
    }
  };

  return { sensors, onDragEnd, rowSortableItems };
}

export function createSortableTbodyWrapper(rowSortableItems: string[]) {
  return forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    function SortableTbody(props, ref) {
      const { children, ...rest } = props;
      return (
        <SortableContext items={rowSortableItems} strategy={verticalListSortingStrategy}>
          <tbody {...rest} ref={ref}>
            {children}
          </tbody>
        </SortableContext>
      );
    },
  );
}
