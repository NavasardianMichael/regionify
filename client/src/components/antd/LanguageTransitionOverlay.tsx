import { type FC } from 'react';
import { Flex, Spin } from 'antd';
import { useLanguageUiStore } from '@/store/languageUi/store';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';

export const LanguageTransitionOverlay: FC = () => {
  const { t } = useTypedTranslation();
  const active = useLanguageUiStore((s) => s.isLanguageTransitioning);

  if (!active) {
    return null;
  }

  return (
    <Flex
      align="center"
      justify="center"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={t('nav.languageSwitchingOverlay')}
      className="pointer-events-auto fixed inset-0 z-[10000] bg-white/45 backdrop-blur-sm dark:bg-black/35"
      data-i18n-key="nav.languageSwitchingOverlay"
    >
      <Spin size="large" />
    </Flex>
  );
};
