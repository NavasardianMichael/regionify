import { type FC, type PropsWithChildren, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { App as AntApp, ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import {
  type AntdLocaleModule,
  loadAntdAppLocale,
  resolveAppLocale,
} from '@/helpers/antdAppLocale';
import { FeedbackProvider } from '@/components/antd/FeedbackProvider';
import { LanguageTransitionOverlay } from '@/components/antd/LanguageTransitionOverlay';
import { theme } from '@/styles/antd-theme';

const ANT_APP_MESSAGE_PROPS = {
  duration: 5,
  top: 24,
};

export const AntdProvider: FC<PropsWithChildren> = ({ children }) => {
  const { i18n } = useTranslation();
  const [antdLocale, setAntdLocale] = useState<AntdLocaleModule>(enUS);

  useEffect(() => {
    const code = resolveAppLocale(i18n.resolvedLanguage ?? i18n.language);
    let cancelled = false;
    void loadAntdAppLocale[code]()
      .then((loc) => {
        if (!cancelled) setAntdLocale(loc);
      })
      .catch(() => {
        if (!cancelled) setAntdLocale(enUS);
      });
    return () => {
      cancelled = true;
    };
  }, [i18n.language, i18n.resolvedLanguage]);

  return (
    <ConfigProvider theme={theme} locale={antdLocale}>
      <AntApp message={ANT_APP_MESSAGE_PROPS}>
        <FeedbackProvider>
          {children}
          <LanguageTransitionOverlay />
        </FeedbackProvider>
      </AntApp>
    </ConfigProvider>
  );
};
