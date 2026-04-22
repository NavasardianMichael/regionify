import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, type Locale, SUPPORTED_LOCALES } from '@regionify/shared';
import i18n from 'i18next';
import { getStoredLocale } from '@/helpers/localeStorage';

import { resources } from '@/locales';

const defaultNs = 'common' as const;

i18n.use(initReactI18next).init({
  resources,
  lng: getStoredLocale() ?? DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: [...SUPPORTED_LOCALES],
  defaultNS: defaultNs,
  ns: [defaultNs],
  interpolation: {
    escapeValue: false,
  },
});

export { defaultNs };
export type { Locale };
