import type { Locale } from '@regionify/shared';
import { SUPPORTED_LOCALES } from '@regionify/shared';

/** Display name per locale (in that language). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ru: 'Русский',
  ar: 'العربية',
  zh: '中文',
};

export const LOCALE_OPTIONS = SUPPORTED_LOCALES.map((code) => ({
  code,
  label: LOCALE_LABELS[code],
}));
