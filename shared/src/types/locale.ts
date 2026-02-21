/** Supported UI locale codes (BCP 47 / ISO 639-1). */
export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'ru', 'zh', 'pt', 'de'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
