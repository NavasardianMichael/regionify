import { type FC, type ReactElement } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, type useSensors } from '@dnd-kit/core';
import { Alert, Button, Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

type BodyProps = {
  isGoogleSheetsReadOnly: boolean;
  dataTable: ReactElement;
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  canAddMissing: boolean;
  onAddMissingRow: () => void;
};

export const Body: FC<BodyProps> = ({
  isGoogleSheetsReadOnly,
  dataTable,
  sensors,
  onDragEnd,
  canAddMissing,
  onAddMissingRow,
}) => {
  const { t } = useTypedTranslation();

  return (
    <Flex vertical gap="small" className="py-md min-h-0 min-w-0 flex-1 basis-0">
      {isGoogleSheetsReadOnly ? (
        <Alert
          type="info"
          showIcon
          className="manual-entry-google-sync-alert border-primary/30! bg-primary/10! [&_.ant-alert-icon]:text-primary! [&_.ant-alert-title]:text-primary shrink-0 [&_.ant-alert-info]:bg-transparent! [&_.ant-alert-title]:mb-0!"
          title={
            <Typography.Text
              className="text-primary text-sm"
              data-i18n-key="visualizer.manualEntry.googleSheetsReadOnlyNote"
            >
              {t('visualizer.manualEntry.googleSheetsReadOnlyNote')}
            </Typography.Text>
          }
        />
      ) : null}

      <div className="min-h-0 min-w-0 flex-1 basis-0 overflow-auto">
        {isGoogleSheetsReadOnly ? (
          dataTable
        ) : (
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            {dataTable}
          </DndContext>
        )}
      </div>

      {canAddMissing && !isGoogleSheetsReadOnly ? (
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={onAddMissingRow}
          className="mt-1! w-fit shrink-0 self-start"
          aria-label={t('visualizer.manualEntry.addMissingRow')}
          data-i18n-key="visualizer.manualEntry.addMissingRow"
        >
          {t('visualizer.manualEntry.addMissingRow')}
        </Button>
      ) : null}
    </Flex>
  );
};
