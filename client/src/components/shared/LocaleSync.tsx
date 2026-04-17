import { type FC, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Locale } from '@regionify/shared';
import { DEFAULT_LOCALE } from '@regionify/shared';
import i18n from 'i18next';
import { selectUser } from '@/store/profile/selectors';
import { useProfileStore } from '@/store/profile/store';
import { RTL_LOCALES } from '@/constants/locales';
import { getStoredLocale } from '@/helpers/localeStorage';

/** Syncs i18n language from user.locale or localStorage (guests). Sets document dir/lang for RTL and a11y. */
export const LocaleSync: FC = () => {
  const user = useProfileStore(selectUser);
  const { i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    const locale = (user?.locale ?? getStoredLocale() ?? DEFAULT_LOCALE) as Locale;
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [user?.locale]);

  useEffect(() => {
    const locale = (i18nInstance.language ?? DEFAULT_LOCALE) as Locale;
    document.documentElement.lang = locale;
    document.documentElement.dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
  }, [i18nInstance.language]);

  return null;
};
