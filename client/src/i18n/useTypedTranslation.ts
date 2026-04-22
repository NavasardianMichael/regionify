import { useTranslation as useTranslationOriginal } from 'react-i18next';
import type { TFunction } from 'i18next';

/** Typed t for 'common' namespace. Use dot paths like 'nav.home', 'home.title'. */
export type TypedT = TFunction<'common', undefined>;

export function useTypedTranslation() {
  const { t, i18n } = useTranslationOriginal('common');
  return { t: t as TypedT, i18n, ready: true };
}
