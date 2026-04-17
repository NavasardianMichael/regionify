import type { Locale } from '@regionify/shared';
import { SUPPORTED_LOCALES } from '@regionify/shared';

/** Locales that use RTL layout (e.g. Arabic). When active, document dir is set to rtl. */
export const RTL_LOCALES: Locale[] = [];

/** Display name per locale (in that language). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ru: 'Русский',
  zh: '中文',
  pt: 'Português',
  de: 'Deutsch',
};

export const LOCALE_OPTIONS = SUPPORTED_LOCALES.map((code) => ({
  code,
  label: LOCALE_LABELS[code],
}));
