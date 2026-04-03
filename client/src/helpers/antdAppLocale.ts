import type { Locale as AppLocale } from '@regionify/shared';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@regionify/shared';
import enUS from 'antd/locale/en_US';

export type AntdLocaleModule = typeof enUS;

export function resolveAppLocale(code: string | undefined): AppLocale {
  if (code !== undefined && (SUPPORTED_LOCALES as readonly string[]).includes(code)) {
    return code as AppLocale;
  }
  return DEFAULT_LOCALE;
}

/** English is bundled eagerly; other Ant Design locales load on demand when the UI language changes. */
export const loadAntdAppLocale: Record<AppLocale, () => Promise<AntdLocaleModule>> = {
  en: () => Promise.resolve(enUS),
  de: () => import('antd/locale/de_DE').then((m) => m.default),
  es: () => import('antd/locale/es_ES').then((m) => m.default),
  fr: () => import('antd/locale/fr_FR').then((m) => m.default),
  ru: () => import('antd/locale/ru_RU').then((m) => m.default),
  zh: () => import('antd/locale/zh_CN').then((m) => m.default),
  pt: () => import('antd/locale/pt_BR').then((m) => m.default),
};
