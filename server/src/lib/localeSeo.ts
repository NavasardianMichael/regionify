/**
 * Maps app account locale (see users.locale / i18n) to HTML and Open Graph locale tags.
 *
 * Note: Ideally `<html lang>` matches the primary language of visible title/description copy.
 * We use the creator’s account locale as a practical signal; SEO text may still be in another language.
 */
import { DEFAULT_LOCALE, type Locale, SUPPORTED_LOCALES } from '@regionify/shared';

const SEO_BY_LOCALE: Record<
  Locale,
  {
    htmlLang: string;
    ogLocale: string;
  }
> = {
  en: { htmlLang: 'en', ogLocale: 'en_US' },
  de: { htmlLang: 'de', ogLocale: 'de_DE' },
  es: { htmlLang: 'es', ogLocale: 'es_ES' },
  fr: { htmlLang: 'fr', ogLocale: 'fr_FR' },
  pt: { htmlLang: 'pt', ogLocale: 'pt_PT' },
  ru: { htmlLang: 'ru', ogLocale: 'ru_RU' },
  zh: { htmlLang: 'zh-Hans', ogLocale: 'zh_CN' },
};

function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function localeToHtmlAndOg(locale: string | null | undefined): {
  htmlLang: string;
  ogLocale: string;
} {
  const key = locale && isLocale(locale) ? locale : DEFAULT_LOCALE;
  return SEO_BY_LOCALE[key];
}
