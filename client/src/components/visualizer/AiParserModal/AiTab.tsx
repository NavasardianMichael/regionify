import {
  type ChangeEventHandler,
  type FC,
  type ReactNode,
  Suspense,
  useCallback,
  useMemo,
} from 'react';
import { Flex, Spin } from 'antd';
import type { ParsedRow } from '@/helpers/importDataParsers';
import { Body } from './Body';
import { TableView } from './TableViewLazy';

type ViewMode = 'ai' | 'table';

type AiTabProps = {
  placeholder: string;
  textValue: string;
  onTextChange: (value: string) => void;
  isStreaming: boolean;
  textareaDisabled: boolean;
  viewMode: ViewMode;
  rows: ParsedRow[];
  onRowsChange: (rows: ParsedRow[]) => void;
  hasTimeColumn: boolean;
  tableLabels: {
    empty: string;
    addRow: string;
    columns: { id: string; label: string; value: string; time: string };
  };
  footer: ReactNode;
};

export const AiTab: FC<AiTabProps> = ({
  placeholder,
  textValue,
  onTextChange,
  isStreaming,
  textareaDisabled,
  viewMode,
  rows,
  onRowsChange,
  hasTimeColumn,
  tableLabels,
  footer,
}) => {
  const handleTextChange = useCallback<ChangeEventHandler<HTMLTextAreaElement>>(
    (e) => onTextChange(e.target.value),
    [onTextChange],
  );

  const viewByMode = useMemo<Record<ViewMode, ReactNode>>(
    () => ({
      ai: (
        <Body
          value={textValue}
          onChange={handleTextChange}
          placeholder={placeholder}
          disabled={textareaDisabled}
          isStreaming={isStreaming}
        />
      ),
      table: (
        <Suspense
          fallback={
            <Flex justify="center" align="center" className="flex-1">
              <Spin />
            </Flex>
          }
        >
          <TableView
            rows={rows}
            onChange={onRowsChange}
            hasTimeColumn={hasTimeColumn}
            emptyText={tableLabels.empty}
            addRowLabel={tableLabels.addRow}
            columnLabels={tableLabels.columns}
          />
        </Suspense>
      ),
    }),
    [
      handleTextChange,
      hasTimeColumn,
      isStreaming,
      onRowsChange,
      placeholder,
      rows,
      tableLabels,
      textValue,
      textareaDisabled,
    ],
  );

  return (
    <Flex vertical gap="middle" className="h-full min-h-0">
      {viewByMode[viewMode]}
      <div className="shrink-0">{footer}</div>
    </Flex>
  );
};
