import { type FC, type PropsWithChildren, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Locale as AppLocale } from '@regionify/shared';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@regionify/shared';
import { App as AntApp, ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import { FeedbackProvider } from '@/components/antd/FeedbackProvider';
import { theme } from '@/styles/antd-theme';

const ANT_APP_MESSAGE_PROPS = {
  duration: 5,
  top: 24,
};

type AntdLocale = typeof enUS;

function resolveAppLocale(code: string | undefined): AppLocale {
  if (code !== undefined && (SUPPORTED_LOCALES as readonly string[]).includes(code)) {
    return code as AppLocale;
  }
  return DEFAULT_LOCALE;
}

/** English is bundled eagerly; other Ant Design locales load on demand when the UI language changes. */
const loadAntdLocale: Record<AppLocale, () => Promise<AntdLocale>> = {
  en: () => Promise.resolve(enUS),
  de: () => import('antd/locale/de_DE').then((m) => m.default),
  es: () => import('antd/locale/es_ES').then((m) => m.default),
  fr: () => import('antd/locale/fr_FR').then((m) => m.default),
  ru: () => import('antd/locale/ru_RU').then((m) => m.default),
  zh: () => import('antd/locale/zh_CN').then((m) => m.default),
  pt: () => import('antd/locale/pt_BR').then((m) => m.default),
};

export const AntdProvider: FC<PropsWithChildren> = ({ children }) => {
  const { i18n } = useTranslation();
  const [antdLocale, setAntdLocale] = useState<AntdLocale>(enUS);

  useEffect(() => {
    const code = resolveAppLocale(i18n.resolvedLanguage ?? i18n.language);
    let cancelled = false;
    void loadAntdLocale[code]()
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
        <FeedbackProvider>{children}</FeedbackProvider>
      </AntApp>
    </ConfigProvider>
  );
};
