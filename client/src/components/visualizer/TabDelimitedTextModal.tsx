import { type FC, useCallback, useEffect, useState } from 'react';
import { CopyOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Modal, Tooltip, Typography } from 'antd';
import {
  selectData,
  selectSetVisualizerState,
  selectTimelineData,
  selectTimePeriods,
} from '@/store/mapData/selectors';
import { useVisualizerStore } from '@/store/mapData/store';
import { IMPORT_DATA_TYPES } from '@/constants/data';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import { commitParsedImport } from '@/helpers/commitParsedImport';
import { parseCSV } from '@/helpers/importDataParsers';
import { serializeToTabDelimited } from '@/helpers/manualDataEntryHelpers';
import { useAppFeedback } from '@/components/shared/useAppFeedback';
import { showMessageWithClose } from '@/components/visualizer/ImportDataPanel/importDataPanelUtils';

const TAB_DELIMITED_EXAMPLE = 'id\tlabel\tvalue\nUS-TX\tTexas\t42\nUS-CA\tCalifornia\t100';

type Props = {
  open: boolean;
  onClose: () => void;
  mapRegionIds: string[];
  historicalDataImport: boolean;
};

const TabDelimitedTextModal: FC<Props> = ({
  open,
  onClose,
  mapRegionIds,
  historicalDataImport,
}) => {
  const { t } = useTypedTranslation();
  const { message: messageApi } = useAppFeedback();

  const data = useVisualizerStore(selectData);
  const timelineData = useVisualizerStore(selectTimelineData);
  const timePeriods = useVisualizerStore(selectTimePeriods);
  const setVisualizerState = useVisualizerStore(selectSetVisualizerState);

  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setText(serializeToTabDelimited(data, timelineData, timePeriods));
    setError(null);
    setSaving(false);
  }, [open, data, timelineData, timePeriods]);

  const handleCopyExample = useCallback(() => {
    navigator.clipboard.writeText(TAB_DELIMITED_EXAMPLE).catch(() => undefined);
  }, []);

  const handleSave = useCallback(async () => {
    setError(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setError(t('visualizer.tabDelimitedModal.pasteFormatError'));
      return;
    }

    setSaving(true);
    try {
      const result = parseCSV(trimmed);
      if (typeof result === 'object' && 'error' in result) {
        setError(t('visualizer.tabDelimitedModal.pasteMissingId'));
        return;
      }
      if (result.length === 0) {
        setError(t('visualizer.tabDelimitedModal.pasteFormatError'));
        return;
      }

      const outcome = commitParsedImport(result, mapRegionIds, historicalDataImport);
      if (!outcome.ok) {
        setError(t('visualizer.tabDelimitedModal.pasteFormatError'));
        return;
      }

      if (outcome.variant === 'timeline') {
        showMessageWithClose(
          messageApi,
          'success',
          t('messages.importedRowsPeriods', {
            count: outcome.rowCount,
            periods: outcome.periodCount,
          }),
        );
      } else {
        if (outcome.sideEffect === 'info_time_on_observer') {
          showMessageWithClose(
            messageApi,
            'info',
            t('messages.timeSeriesDetected', { planName: t('plans.items.chronographer.name') }),
          );
        }
        if (outcome.sideEffect === 'warn_no_time_chronographer') {
          showMessageWithClose(messageApi, 'warning', t('messages.noTimeColumnDetected'));
        }
        showMessageWithClose(
          messageApi,
          'success',
          t('messages.importedRegions', { count: outcome.rowCount }),
        );
      }

      setVisualizerState({ importDataType: IMPORT_DATA_TYPES.tabDelimited });
      onClose();
    } finally {
      setSaving(false);
    }
  }, [text, mapRegionIds, historicalDataImport, messageApi, setVisualizerState, onClose, t]);

  return (
    <Modal
      title={t('visualizer.tabDelimitedModal.title')}
      open={open}
      onCancel={onClose}
      closable
      maskClosable={false}
      footer={
        <Flex justify="flex-end" gap="small">
          <Button onClick={onClose}>{t('nav.cancel')}</Button>
          <Button type="primary" onClick={() => void handleSave()} loading={saving}>
            {t('visualizer.save')}
          </Button>
        </Flex>
      }
      centered
      destroyOnHidden
      focusable={{ trap: false }}
    >
      <Flex vertical gap="small" className="py-md">
        <Flex justify="space-between" align="center">
          <Typography.Text type="secondary" className="text-xs">
            {t('visualizer.tabDelimitedModal.pasteFormatNote')}
          </Typography.Text>
          <Tooltip title={t('visualizer.tabDelimitedModal.copyExampleTooltip')}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopyExample}
              aria-label={t('visualizer.tabDelimitedModal.copyExampleTooltip')}
              className="shrink-0 text-gray-500"
            />
          </Tooltip>
        </Flex>
        <Input.TextArea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          placeholder={t('visualizer.tabDelimitedModal.placeholder')}
          rows={14}
          className="font-mono text-sm"
          styles={{ textarea: { resize: 'none' } }}
        />
        {error ? (
          <Typography.Text type="danger" className="text-sm">
            {error}
          </Typography.Text>
        ) : null}
      </Flex>
    </Modal>
  );
};

export default TabDelimitedTextModal;
