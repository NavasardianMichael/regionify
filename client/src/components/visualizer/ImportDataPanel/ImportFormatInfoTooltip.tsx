import { type FC } from 'react';
import { Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

/** Expected format info tooltip in Import Data panel. */
export const ImportFormatInfoTooltip: FC = () => {
  const { t } = useTypedTranslation();

  return (
    <ul className="m-0 list-disc space-y-2 p-3 ps-8 text-sm text-white">
      <li data-i18n-key="visualizer.importFormatTooltip.id">
        <Typography.Text strong className="font-semibold text-white!">
          id
        </Typography.Text>{' '}
        — {t('visualizer.importFormatTooltip.id')}
      </li>
      <li data-i18n-key="visualizer.importFormatTooltip.label">
        <Typography.Text strong className="font-semibold text-white!">
          label
        </Typography.Text>{' '}
        — {t('visualizer.importFormatTooltip.label')}
      </li>
      <li data-i18n-key="visualizer.importFormatTooltip.value">
        <Typography.Text strong className="font-semibold text-white!">
          value
        </Typography.Text>{' '}
        — {t('visualizer.importFormatTooltip.value')}
      </li>
    </ul>
  );
};
