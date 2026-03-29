/* eslint-disable react-refresh/only-export-components -- Table DnD helpers and sortable primitives live together */
import React, { forwardRef, type ReactNode, useMemo } from 'react';
import { MenuOutlined } from '@ant-design/icons';
import type { DragEndEvent } from '@dnd-kit/core';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const ROW_DND_PREFIX = 'row:';

export const COL_DND_PREFIX = 'col:';

export function colDndId(key: string): string {
  return `${COL_DND_PREFIX}${key}`;
}

export function parseColDndId(id: string | number): string | null {
  const s = String(id);
  return s.startsWith(COL_DND_PREFIX) ? s.slice(COL_DND_PREFIX.length) : null;
}

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

type UseManualEntryTableDndArgs = {
  rowKeysInOrder: string[];
  middleColumnKeys: string[];
  onRowReorder: (keysInNewOrder: string[]) => void;
  onColumnReorder: (keysInNewOrder: string[]) => void;
};

export type SortableColumnTitleProps = {
  id: string;
  title: React.ReactNode;
};

export function SortableColumnTitle({ id, title }: SortableColumnTitleProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: colDndId(id),
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9 } : {}),
  };

  return (
    <div ref={setNodeRef} className="flex min-w-0 items-center gap-1" style={style} {...attributes}>
      <span {...listeners} className="inline-flex cursor-grab touch-none text-gray-400">
        <MenuOutlined className="text-xs" aria-hidden />
      </span>
      <span className="min-w-0 truncate">{title}</span>
    </div>
  );
}

export function useManualEntryTableDnd({
  rowKeysInOrder,
  middleColumnKeys,
  onRowReorder,
  onColumnReorder,
}: UseManualEntryTableDndArgs): {
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  rowSortableItems: string[];
  colSortableItems: string[];
} {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const rowSortableItems = useMemo(() => rowKeysInOrder.map((k) => rowDndId(k)), [rowKeysInOrder]);

  const colSortableItems = useMemo(
    () => middleColumnKeys.map((k) => colDndId(k)),
    [middleColumnKeys],
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over == null || active.id === over.id) return;

    const activeStr = String(active.id);

    if (activeStr.startsWith(ROW_DND_PREFIX)) {
      const rowActive = parseRowDndId(active.id);
      const rowOver = parseRowDndId(over.id);
      if (rowActive && rowOver) {
        const oldIndex = rowKeysInOrder.indexOf(rowActive);
        const newIndex = rowKeysInOrder.indexOf(rowOver);
        if (oldIndex < 0 || newIndex < 0) return;
        onRowReorder(arrayMove(rowKeysInOrder, oldIndex, newIndex));
      }
      return;
    }

    if (activeStr.startsWith(COL_DND_PREFIX)) {
      const colActive = parseColDndId(active.id);
      const colOver = parseColDndId(over.id);
      if (colActive && colOver) {
        const oldIndex = middleColumnKeys.indexOf(colActive);
        const newIndex = middleColumnKeys.indexOf(colOver);
        if (oldIndex < 0 || newIndex < 0) return;
        onColumnReorder(arrayMove(middleColumnKeys, oldIndex, newIndex));
      }
    }
  };

  return { sensors, onDragEnd, rowSortableItems, colSortableItems };
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

export function createSortableTheadWrapper(colSortableItems: string[]) {
  return forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    function SortableThead(props, ref) {
      const { children, ...rest } = props;
      return (
        <SortableContext items={colSortableItems} strategy={horizontalListSortingStrategy}>
          <thead {...rest} ref={ref}>
            {children}
          </thead>
        </SortableContext>
      );
    },
  );
}
