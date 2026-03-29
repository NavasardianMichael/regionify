/* eslint-disable react-refresh/only-export-components -- Table DnD helpers and sortable primitives live together */
import React, { forwardRef, type ReactNode, useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const ROW_DND_PREFIX = 'row:';

export function rowDndId(key: string): string {
  return `${ROW_DND_PREFIX}${key}`;
}

export function parseRowDndId(id: string | number): string | null {
  const s = String(id);
  return s.startsWith(ROW_DND_PREFIX) ? s.slice(ROW_DND_PREFIX.length) : null;
}

/**
 * Body cell index that receives drag listeners.
 * With `rowSelection`, Ant Design injects the selection column first; index column is second.
 */
export const DRAG_HANDLE_COLUMN_INDEX = 1;

type SortableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  children: ReactNode;
  'data-row-key'?: string;
};

export const SortableBodyRow = forwardRef<HTMLTableRowElement, SortableRowProps>(
  function SortableBodyRow(props, forwardedRef) {
    const { children, ...rest } = props;
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
      ...rest.style,
      transform: rowKey != null ? CSS.Transform.toString(transform) : undefined,
      transition,
      ...(isDragging ? { position: 'relative', zIndex: 9 } : {}),
    };

    const kids = React.Children.map(children, (child, index) => {
      if (index !== DRAG_HANDLE_COLUMN_INDEX || !React.isValidElement(child)) {
        return child;
      }
      const el = child as React.ReactElement<{ style?: React.CSSProperties }>;
      return React.cloneElement(el, {
        ...listeners,
        style: { ...el.props.style, cursor: 'grab' },
      });
    });

    return (
      <tr {...rest} ref={setRefs} style={style} {...attributes}>
        {kids}
      </tr>
    );
  },
);

type UseManualEntryRowDndArgs = {
  rowKeysInOrder: string[];
  onRowReorder: (keysInNewOrder: string[]) => void;
};

export function useManualEntryTableDnd({
  rowKeysInOrder,
  onRowReorder,
}: UseManualEntryRowDndArgs): {
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  rowSortableItems: string[];
} {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const rowSortableItems = useMemo(() => rowKeysInOrder.map((k) => rowDndId(k)), [rowKeysInOrder]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over == null || active.id === over.id) return;

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
