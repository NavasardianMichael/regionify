import { type FC } from 'react';
import { Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

/** Confirm body when offering to normalize legend ranges after an AI import. */
export const NormalizeRangesConfirmContent: FC = () => {
  const { t } = useTypedTranslation();

  return (
    <Flex vertical gap="small">
      <Typography.Text data-i18n-key="visualizer.aiParserModal.normalizeRangesPromptBody">
        {t('visualizer.aiParserModal.normalizeRangesPromptBody')}
      </Typography.Text>
      <Typography.Text
        type="secondary"
        className="text-xs"
        data-i18n-key="visualizer.aiParserModal.normalizeRangesPromptHint"
      >
        {t('visualizer.aiParserModal.normalizeRangesPromptHint')}
      </Typography.Text>
    </Flex>
  );
};
