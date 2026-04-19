import { type FC, useCallback, useMemo } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Input, InputNumber, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ParsedRow } from '@/helpers/importDataParsers';
import scrollbarStyles from '@/components/shared/modalBodyScrollbar.module.css';

type TableRow = ParsedRow & { key: string };

type Props = {
  rows: ParsedRow[];
  onChange: (rows: ParsedRow[]) => void;
  hasTimeColumn: boolean;
  emptyText: string;
  addRowLabel: string;
  columnLabels: { id: string; label: string; value: string; time: string };
};

export const TableView: FC<Props> = ({
  rows,
  onChange,
  hasTimeColumn,
  emptyText,
  addRowLabel,
  columnLabels,
}) => {
  const dataSource = useMemo<TableRow[]>(
    () => rows.map((row, index) => ({ ...row, key: `${index}-${row.id}` })),
    [rows],
  );

  const updateRow = useCallback(
    (index: number, patch: Partial<ParsedRow>) => {
      const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
      onChange(next);
    },
    [onChange, rows],
  );

  const removeRow = useCallback(
    (index: number) => {
      onChange(rows.filter((_, i) => i !== index));
    },
    [onChange, rows],
  );

  const addRow = useCallback(() => {
    onChange([
      ...rows,
      { id: '', label: '', value: 0, ...(hasTimeColumn ? { timePeriod: '' } : {}) },
    ]);
  }, [hasTimeColumn, onChange, rows]);

  const handleCellChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const index = Number(event.currentTarget.dataset.index);
      const field = event.currentTarget.dataset.field as keyof ParsedRow | undefined;
      if (!field || Number.isNaN(index)) return;
      updateRow(index, { [field]: event.currentTarget.value } as Partial<ParsedRow>);
    },
    [updateRow],
  );

  const handleRemoveClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const index = Number(event.currentTarget.dataset.index);
      if (Number.isNaN(index)) return;
      removeRow(index);
    },
    [removeRow],
  );

  const columns = useMemo<ColumnsType<TableRow>>(() => {
    const base: ColumnsType<TableRow> = [
      {
        title: columnLabels.id,
        dataIndex: 'id',
        key: 'id',
        width: 140,
        render: (_value: string, row, index) => (
          <Input
            size="small"
            value={row.id}
            data-index={index}
            data-field="id"
            onChange={handleCellChange}
            className="font-mono"
          />
        ),
      },
      {
        title: columnLabels.label,
        dataIndex: 'label',
        key: 'label',
        render: (_value: string, row, index) => (
          <Input
            size="small"
            value={row.label}
            data-index={index}
            data-field="label"
            onChange={handleCellChange}
          />
        ),
      },
      {
        title: columnLabels.value,
        dataIndex: 'value',
        key: 'value',
        width: 140,
        render: (_value: number, row, index) => (
          <InputNumber
            size="small"
            value={row.value}
            onChange={(next) => updateRow(index, { value: typeof next === 'number' ? next : 0 })}
            className="w-full!"
          />
        ),
      },
    ];

    if (hasTimeColumn) {
      base.push({
        title: columnLabels.time,
        dataIndex: 'timePeriod',
        key: 'timePeriod',
        width: 120,
        render: (_value: string | undefined, row, index) => (
          <Input
            size="small"
            value={row.timePeriod ?? ''}
            data-index={index}
            data-field="timePeriod"
            onChange={handleCellChange}
          />
        ),
      });
    }

    base.push({
      title: '',
      key: 'actions',
      width: 48,
      align: 'center',
      render: (_unused, _row, index) => (
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          data-index={index}
          onClick={handleRemoveClick}
          aria-label="Remove row"
        />
      ),
    });

    return base;
  }, [columnLabels, handleCellChange, handleRemoveClick, hasTimeColumn, updateRow]);

  return (
    <Flex vertical gap="small" className="min-h-0 flex-1">
      <div className={`${scrollbarStyles.thinScroll} min-h-0 flex-1 overflow-auto`}>
        <Table<TableRow>
          size="small"
          rowKey="key"
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          locale={{ emptyText: <Typography.Text type="secondary">{emptyText}</Typography.Text> }}
          className="[&_.ant-table-cell]:align-middle"
        />
      </div>
      <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addRow} className="w-fit">
        {addRowLabel}
      </Button>
    </Flex>
  );
};
